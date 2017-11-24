import {
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
  private targetQueues = Object.create(null);
  private index = 0;
  private _queue: any[] = [];

  constructor(name: string, options: any = {}, globalOptions: any = {}) {
    this.name = name;
    this.options = options;
    this.globalOptions = globalOptions;
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
    let guid = this.guidForTarget(target);

    if (guid) {
      this.pushUniqueWithGuid(guid, target, method, args, stack);
    } else {
      this.pushUniqueWithoutGuid(target, method, args, stack);
    }

    return {
      queue: this,
      target,
      method
    };
  }

  public flush(sync?) {
    let { before, after } = this.options;
    let target;
    let method;
    let args;
    let errorRecordedForStack;

    this.targetQueues = Object.create(null);
    let queueItems;
    if (this._queueBeingFlushed.length > 0) {
      queueItems = this._queueBeingFlushed;
    } else {
      queueItems = this._queueBeingFlushed = this._queue;
      this._queue = [];
    }

    if (before) {
      before();
    }

    let invoke;
    if (queueItems.length > 0) {

      for (let i = this.index; i < queueItems.length; i += 4) {
        this.index += 4;

        target                = queueItems[i];
        method                = queueItems[i + 1];
        args                  = queueItems[i + 2];
        errorRecordedForStack = queueItems[i + 3]; // Debugging assistance

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
          this.invoke(target, method, args, errorRecordedForStack);
        }

        if (this.index !== this._queueBeingFlushed.length &&
          this.globalOptions.mustYield && this.globalOptions.mustYield()) {
          return QUEUE_STATE.Pause;
        }
      }
    }

    if (after) {
      after();
    }

    this._queueBeingFlushed.length = 0;
    this.index = 0;
    if (sync !== false &&
        this._queue.length > 0) {
      // check if new items have been added
      this.flush(true);
    }
  }

  public hasWork() {
    return this._queueBeingFlushed.length > 0 || this._queue.length > 0;
  }

  public cancel({ target, method }) {
    let queue = this._queue;
    let currentTarget;
    let currentMethod;
    let i;
    let l;
    let t;

    let guid = this.guidForTarget(target);
    let targetQueue = guid ? this.targetQueues[guid] : undefined;

    if (targetQueue !== undefined) {
      for (i = 0, l = targetQueue.length; i < l; i += 2) {
        t = targetQueue[i];
        if (t === method) {
          targetQueue.splice(i, 1);
        }
      }
    }

    for (i = 0, l = queue.length; i < l; i += 4) {
      currentTarget = queue[i];
      currentMethod = queue[i + 1];

      if (currentTarget === target &&
          currentMethod === method) {
        queue.splice(i, 4);
        return true;
      }
    }

    // if not found in current queue
    // could be in the queue that is being flushed
    queue = this._queueBeingFlushed;

    for (i = 0, l = queue.length; i < l; i += 4) {
      currentTarget = queue[i];
      currentMethod = queue[i + 1];

      if (currentTarget === target &&
          currentMethod === method) {
        // don't mess with array during flush
        // just nullify the method
        queue[i + 1] = null;
        return true;
      }
    }

    return false;
  }

  private guidForTarget(target) {
    if (!target) { return; }

    let peekGuid = this.globalOptions.peekGuid;
    if (peekGuid) {
      return peekGuid(target);
    }

    let KEY = this.globalOptions.GUID_KEY;
    if (KEY) {
      return target[KEY];
    }
  }

  private pushUniqueWithoutGuid(target, method, args, stack) {
    let queue = this._queue;

    for (let i = 0, l = queue.length; i < l; i += 4) {
      let currentTarget = queue[i];
      let currentMethod = queue[i + 1];

      if (currentTarget === target && currentMethod === method) {
        queue[i + 2] = args;  // replace args
        queue[i + 3] = stack; // replace stack
        return;
      }
    }

    queue.push(target, method, args, stack);
  }

  private targetQueue(targetQueue, target, method, args, stack) {
    let queue = this._queue;

    for (let i = 0, l = targetQueue.length; i < l; i += 2) {
      let currentMethod = targetQueue[i];

      if (currentMethod === method) {
        let currentIndex  = targetQueue[i + 1];
        queue[currentIndex + 2] = args;  // replace args
        queue[currentIndex + 3] = stack; // replace stack
        return;
      }
    }

    targetQueue.push(
      method,
      queue.push(target, method, args, stack) - 4
    );
  }

  private pushUniqueWithGuid(guid, target, method, args, stack) {
    let localQueue = this.targetQueues[guid];

    if (localQueue !== undefined) {
      this.targetQueue(localQueue, target, method, args, stack);
    } else {
      this.targetQueues[guid] = [
        method,
        this._queue.push(target, method, args, stack) - 4
      ];
    }
  }

  private invoke(target, method, args, errorRecordedForStack) {
    try {
      method.apply(target, args);
    } catch (error) {
      let onError = getOnError(this.globalOptions);
      if (onError) {
        onError(error, errorRecordedForStack);
      } else {
        throw error;
      }
    }
  }

}
