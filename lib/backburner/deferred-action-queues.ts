import Queue, { QUEUE_STATE } from './queue';
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

  private queueNameIndex = 0;
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
    let numberOfQueues = this.queueNames.length;

    while (this.queueNameIndex < numberOfQueues) {
      queueName = this.queueNames[this.queueNameIndex];
      queue = this.queues[queueName];

      if (queue.hasWork() === false) {
        this.queueNameIndex++;
      } else {
        if (queue.flush(false /* async */) === QUEUE_STATE.Pause) {
          return QUEUE_STATE.Pause;
        }
        this.queueNameIndex = 0; // only reset to first queue if non-pause break
      }
    }
  }
}
