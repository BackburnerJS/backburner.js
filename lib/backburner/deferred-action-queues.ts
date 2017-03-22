import Queue from './queue';
import {
  each,
  noSuchMethod,
  noSuchQueue
} from './utils';

export default class DeferredActionQueues {
  public queues: {
    [name: string]: Queue
  };

  private queueNames: string[];

  private options: any;

  constructor(queueNames: string[], options: any) {
    let queues = this.queues = {};
    this.queueNames = queueNames = queueNames || [];

    this.options = options;

    each(queueNames, function(queueName) {
      queues[queueName] = new Queue(queueName, options[queueName], options);
    });
  }

  /*
    @method schedule
    @param {String} queueName
    @param {Any} target
    @param {Any} method
    @param {Any} args
    @param {Boolean} onceFlag
    @param {Any} stack
    @return queue
  */
  public schedule(queueName: string, target: any, method: any, args: any, onceFlag: boolean, stack: any) {
    let queues = this.queues;
    let queue = queues[queueName];

    if (!queue) {
      noSuchQueue(queueName);
    }

    if (!method) {
      noSuchMethod(queueName);
    }

    if (onceFlag) {
      return queue.pushUnique(target, method, args, stack);
    } else {
      return queue.push(target, method, args, stack);
    }
  }

  /*
    @method flush
    DeferredActionQueues.flush() calls Queue.flush()
  */
  public flush() {
    let queue;
    let queueName;
    let queueNameIndex = 0;
    let numberOfQueues = this.queueNames.length;

    while (queueNameIndex < numberOfQueues) {
      queueName = this.queueNames[queueNameIndex];
      queue = this.queues[queueName];

      if (queue._queue.length === 0) {
        queueNameIndex++;
      } else {
        queue.flush(false /* async */);
        queueNameIndex = 0;
      }
    }
  }
}
