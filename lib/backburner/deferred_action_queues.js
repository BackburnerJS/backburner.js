import Queue from "backburner/queue";

function DeferredActionQueues(queueNames, options) {
  var queues = this.queues = {};
  this.queueNames = queueNames = queueNames || [];

  var queueName;
  for (var i = 0, l = queueNames.length; i < l; i++) {
    queueName = queueNames[i];
    queues[queueName] = new Queue(this, queueName, options[queueName]);
  }
};

DeferredActionQueues.prototype = {
  queueNames: null,
  queues: null,

  schedule: function(queueName, target, method, args, onceFlag, stack) {
    var queues = this.queues,
        queue = queues[queueName];

    if (!queue) { throw new Error("You attempted to schedule an action in a queue (" + queueName + ") that doesn't exist"); }

    if (onceFlag) {
      return queue.pushUnique(target, method, args, stack);
    } else {
      return queue.push(target, method, args, stack);
    }
  },

  flush: function() {
    var queues = this.queues,
        queueNames = this.queueNames,
        queueName, queue, priorQueueIndex,
        queueIndex = 0, numberOfQueues = queueNames.length;

    outerloop:
    while (queueIndex < numberOfQueues) {
      queueName = queueNames[queueIndex];
      queue = queues[queueName];

      var options = queue.options,
          before = options && options.before,
          after = options && options.after,
          action, target, method, args,
          actionIndex = 0, numberOfActions = queue._queue.length;

      if (numberOfActions && before) { before(); }
      while (actionIndex < numberOfActions) {
        action = queue.shift();
        target = action[0];
        method = action[1];
        args   = action[2];

        if (typeof method === 'string') { method = target[method]; }

        // TODO: error handling
        method.apply(target, args);

        actionIndex++;
      }
      if (numberOfActions && after) { after(); }

      if ((priorQueueIndex = queue.priorQueueWithActions()) !== -1) {
        queueIndex = priorQueueIndex;
        continue outerloop;
      }

      queueIndex++;
    }
  }
};

export DeferredActionQueues;