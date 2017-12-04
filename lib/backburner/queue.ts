import {
  findItem,
  getOnError
} from './utils';

export const enum QUEUE_STATE {
  Pause = 1
}

export default class Queue {
  private name: string;
  private globalOptions: any;
  private options: any;
  private _queueBeingFlushed: any[] = [];
  private targetQueues = new Map();
  private index = 0;
  private _queue: any[] = [];

  constructor(name: string, options: any = {}, globalOptions: any = {}) {
    this.name = name;
    this.options = options;
    this.globalOptions = globalOptions;
  }

  public flush(sync?) {
    let { before, after } = this.options;
    let target;
    let method;
    let args;
    let errorRecordedForStack;

    this.targetQueues.clear();
    if (this._queueBeingFlushed.length === 0) {
      this._queueBeingFlushed = this._queue;
      this._queue = [];
    }

    if (before !== undefined) {
      before();
    }

    let invoke;
    let queueItems = this._queueBeingFlushed;
    if (queueItems.length > 0) {
      let onError = getOnError(this.globalOptions);
      invoke = onError ? this.invokeWithOnError : this.invoke;

      for (let i = this.index; i < queueItems.length; i += 4) {
        this.index += 4;

        method                = queueItems[i + 1];
        // method could have been nullified / canceled during flush
        if (method !== null) {
          //
          //    ** Attention intrepid developer **
          //
          //    To find out the stack of this task when it was scheduled onto
          //    the run loop, add the following to your app.js:
          //
          //    Ember.run.backburner.DEBUG = true; // NOTE: This slows your app, don't leave it on in production.
          //
          //    Once that is in place, when you are at a breakpoint and navigate
          //    here in the stack explorer, you can look at `errorRecordedForStack.stack`,
          //    which will be the captured stack when this job was scheduled.
          //
          //    One possible long-term solution is the following Chrome issue:
          //       https://bugs.chromium.org/p/chromium/issues/detail?id=332624
          //
          target                = queueItems[i];
          args                  = queueItems[i + 2];
          errorRecordedForStack = queueItems[i + 3]; // Debugging assistance
          invoke(target, method, args, onError, errorRecordedForStack);
        }

        if (this.index !== this._queueBeingFlushed.length &&
          this.globalOptions.mustYield && this.globalOptions.mustYield()) {
          return QUEUE_STATE.Pause;
        }
      }
    }

    if (after !== undefined) {
      after();
    }

    this._queueBeingFlushed.length = 0;
    this.index = 0;
    if (sync !== false && this._queue.length > 0) {
      // check if new items have been added
      this.flush(true);
    }
  }

  public hasWork() {
    return this._queueBeingFlushed.length > 0 || this._queue.length > 0;
  }

  public cancel({ target, method }) {
    let queue = this._queue;
    let targetQueueMap = this.targetQueues.get(target);

    let index;
    if (targetQueueMap !== undefined) {
      index = targetQueueMap.get(method);
      if (index !== undefined) {
        targetQueueMap.delete(method);
      }
    }

    if (index === undefined) {
      index = findItem(target, method, queue);
    }

    if (index > -1) {
      queue.splice(index, 4);
      return true;
    }

    // if not found in current queue
    // could be in the queue that is being flushed
    queue = this._queueBeingFlushed;

    index = findItem(target, method, queue);
    if (index > -1) {
      queue[index + 1] = null;
      return true;
    }

    return false;
  }

  public push(target, method, args, stack) {
    this._queue.push(target, method, args, stack);

    return {
      queue: this,
      target,
      method
    };
  }

  public pushUnique(target, method, args, stack) {
    let localQueueMap = this.targetQueues.get(target);

    if (localQueueMap === undefined) {
      localQueueMap = new Map();
      this.targetQueues.set(target, localQueueMap);
    }

    let index = localQueueMap.get(method);
    if (index === undefined) {
      let queueIndex = this._queue.push(target, method, args, stack) - 4;
      localQueueMap.set(method, queueIndex);
    } else {
      let queue = this._queue;
      queue[index + 2] = args;  // replace args
      queue[index + 3] = stack; // replace stack
    }

    return {
      queue: this,
      target,
      method
    };
  }

  private invoke(target, method, args /*, onError, errorRecordedForStack */) {
    if (args === undefined) {
      method.call(target);
    } else {
      method.apply(target, args);
    }
  }

  private invokeWithOnError(target, method, args, onError, errorRecordedForStack) {
    try {
      if (args === undefined) {
        method.call(target);
      } else {
        method.apply(target, args);
      }
    } catch (error) {
      onError(error, errorRecordedForStack);
    }
  }
}
