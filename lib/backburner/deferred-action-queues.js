import {
  each,
  isString
} from "./utils";
import Queue from "./queue";

function DeferredActionQueues(queueNames, options) {
  var queues = this.queues = {};
  this.queueNames = queueNames = queueNames || [];

  this.options = options;

  each(queueNames, function(queueName) {
    queues[queueName] = new Queue(queueName, options[queueName], options);
  });
}

function noSuchQueue(name) {
  throw new Error("You attempted to schedule an action in a queue (" + name + ") that doesn't exist");
}

DeferredActionQueues.prototype = {
  schedule: function(name, target, method, args, onceFlag, stack) {
    var queues = this.queues;
    var queue = queues[name];

    if (!queue) { noSuchQueue(name); }

    if (onceFlag) {
      return queue.pushUnique(target, method, args, stack);
    } else {
      return queue.push(target, method, args, stack);
    }
  },

  invoke: function(target, method, args, _, _errorRecordedForStack) {
    if (args && args.length > 0) {
      method.apply(target, args);
    } else {
      method.call(target);
    }
  },

  invokeWithOnError: function(target, method, args, onError, errorRecordedForStack) {
    try {
      if (args && args.length > 0) {
        method.apply(target, args);
      } else {
        method.call(target);
      }
    } catch(error) {
      onError(error, errorRecordedForStack);
    }
  },

  flush: function() {
    var queues = this.queues;
    var queueNames = this.queueNames;
    var queueName, queue, queueItems, priorQueueNameIndex;
    var queueNameIndex = 0;
    var numberOfQueues = queueNames.length;
    var options = this.options;
    var onError = options.onError || (options.onErrorTarget && options.onErrorTarget[options.onErrorMethod]);
    var invoke = onError ? this.invokeWithOnError : this.invoke;

    while (queueNameIndex < numberOfQueues) {
      queueName = queueNames[queueNameIndex];
      queue = queues[queueName];
      queueItems = queue._queueBeingFlushed = queue._queue.slice();
      queue._queue = [];
      queue.targetQueues = Object.create(null);

      var queueOptions = queue.options; // TODO: write a test for this
      var before = queueOptions && queueOptions.before;
      var after = queueOptions && queueOptions.after;
      var target, method, args, errorRecordedForStack;
      var queueIndex = 0;
      var numberOfQueueItems = queueItems.length;

      if (numberOfQueueItems && before) {
        before();
      }

      while (queueIndex < numberOfQueueItems) {
        target                = queueItems[queueIndex];
        method                = queueItems[queueIndex+1];
        args                  = queueItems[queueIndex+2];
        errorRecordedForStack = queueItems[queueIndex+3]; // Debugging assistance


        if (isString(method)) {
          method = target[method];
        }

        // method could have been nullified / canceled during flush
        if (method) {
          invoke(target, method, args, onError, errorRecordedForStack);
        }

        queueIndex += 4;
      }

      queue._queueBeingFlushed = null;
      if (numberOfQueueItems && after) {
        after();
      }

      if ((priorQueueNameIndex = indexOfPriorQueueWithActions(this, queueNameIndex)) !== -1) {
        queueNameIndex = priorQueueNameIndex;
      } else {
        queueNameIndex++;
      }
    }
  }
};

function indexOfPriorQueueWithActions(daq, currentQueueIndex) {
  var queueName, queue;

  for (var i = 0, l = currentQueueIndex; i <= l; i++) {
    queueName = daq.queueNames[i];
    queue = daq.queues[queueName];
    if (queue._queue.length) { return i; }
  }

  return -1;
}

export default DeferredActionQueues;
