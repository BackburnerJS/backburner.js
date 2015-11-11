import {
  each
} from './utils';
import Queue from './queue';

export default function DeferredActionQueues(queueNames, options) {
  var queues = this.queues = {};
  this.queueNames = queueNames = queueNames || [];

  this.options = options;

  each(queueNames, function(queueName) {
    queues[queueName] = new Queue(queueName, options[queueName], options);
  });
}

function noSuchQueue(name) {
  throw new Error('You attempted to schedule an action in a queue (' + name + ') that doesn\'t exist');
}

function noSuchMethod(name) {
  throw new Error('You attempted to schedule an action in a queue (' + name + ') for a method that doesn\'t exist');
}

DeferredActionQueues.prototype = {
  schedule: function(name, target, method, args, onceFlag, stack) {
    var queues = this.queues;
    var queue = queues[name];

    if (!queue) {
      noSuchQueue(name);
    }

    if (!method) {
      noSuchMethod(name);
    }

    if (onceFlag) {
      return queue.pushUnique(target, method, args, stack);
    } else {
      return queue.push(target, method, args, stack);
    }
  },

  queueNameIndex: 0,

  next: function() {
    var options = this.options;
    var before = options && options.before;
    var after = options && options.after;

    var queues = this.queues;
    var queueNames = this.queueNames;
    var numberOfQueues = queueNames.length;
    var queue, result, numberOfQueueItems;

    /**
     * TODO: flush() behaivior calls additional before() & after() methods in succession for each self-invoked tail-flush(true).
     * next() does not invoke a tail-flush and also does not create a new queue "flush-segment".
     * Is this a necessary behaivior? what is the intended use-case for before() & after()?
     *
     * Also, do we need to call before() & after() when there are no tasks to run in the corresponding queue?
     *
     * Seems we may be unnecessarily running before() & after() too often?
     */

    // find a loaded queue -- break out early if/when we run a single task
    while (this.queueNameIndex < numberOfQueues) {
      queue = queues[queueNames[this.queueNameIndex]];

      // run before() if no tasks have been run on this queue yet
      if (!queue.isBurning) {
        if (before) {
          before();
        }
      }

      // run the first|next|last task in the queue
      result = queue.next();

      // return out of this loop with a result if a task had run
      if (!result.done) {
        queue.isBurning = true;
        return result;
      }
      // ...otherwise continue to the next queue if the current queue has no tasks left to run
      else {
        if (after) {
          after();
        }
        // reset our queue pointer (to check prior queues) for any new tasks when the current queue has burned down...
        if (queue.isBurning) {
          queue.isBurning = false;
          this.queueNameIndex = 0;
        }
        // ...but go on to the next queue if the current queue was empty and had not actually run any tasks.
        else {
          this.queueNameIndex++;
        }
      }
    }

    // if you have made it here then all tasks in all queues have been burned down

    // start from the begining on the next next()
    this.queueNameIndex = 0;

    // and return with a completed iterator state
    return {
      value: undefined,
      done: true
    }
  },

  flush: function() {
    var queues = this.queues;
    var queueNames = this.queueNames;
    var queueName, queue;
    var queueNameIndex = 0;
    var numberOfQueues = queueNames.length;

    while (queueNameIndex < numberOfQueues) {
      queueName = queueNames[queueNameIndex];
      queue = queues[queueName];

      var numberOfQueueItems = queue._queue.length;

      if (numberOfQueueItems === 0) {
        queueNameIndex++;
      } else {
        queue.flush(false /* async */);
        queueNameIndex = 0;
      }
    }
  }
};
