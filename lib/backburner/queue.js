function Queue(name, options, globalOptions) {
  this.name = name;
  this.globalOptions = globalOptions || {};
  this.options = options;
  this._queue = [];
  this.targetQueues = Object.create(null);
}

Queue.prototype = {
  push: function(target, method, args, stack) {
    var queue = this._queue;
    queue.push(target, method, args, stack);

    return {
      queue: this,
      target: target,
      method: method
    };
  },

  pushUniqueWithoutGuid: function(target, method, args, stack) {
    var queue = this._queue;

    for (var i = 0, l = queue.length; i < l; i += 4) {
      var currentTarget = queue[i];
      var currentMethod = queue[i+1];

      if (currentTarget === target && currentMethod === method) {
        queue[i+2] = args;  // replace args
        queue[i+3] = stack; // replace stack
        return;
      }
    }

    queue.push(target, method, args, stack);
  },

  targetQueue: function(targetQueue, target, method, args, stack) {
    var queue = this._queue;

    for (var i = 0, l = targetQueue.length; i < l; i += 4) {
      var currentMethod = targetQueue[i];
      var currentIndex  = targetQueue[i + 1];

      if (currentMethod === method) {
        queue[currentIndex + 2] = args;  // replace args
        queue[currentIndex + 3] = stack; // replace stack
        return;
      }
    }

    targetQueue.push(
      method,
      queue.push(target, method, args, stack) - 4
    );
  },

  pushUniqueWithGuid: function(guid, target, method, args, stack) {
    var hasLocalQueue = this.targetQueues[guid]

    if (hasLocalQueue) {
      this.targetQueue(hasLocalQueue, target, method, args, stack);
    } else {
      this.targetQueues[guid] = [
        method,
        this._queue.push(target, method, args, stack) - 4
      ];
    }

    return {
      queue: this,
      target: target,
      method: method
    };
  },

  pushUnique: function(target, method, args, stack) {
    var queue = this._queue, currentTarget, currentMethod, i, l;
    var KEY = this.globalOptions.GUID_KEY;

    if (target && KEY) {
      var guid = target[KEY];
      if (guid) {
        return this.pushUniqueWithGuid(guid, target, method, args, stack);
      }
    }

    this.pushUniqueWithoutGuid(target, method, args, stack);

    return {
      queue: this,
      target: target,
      method: method
    };
  },

  // TODO: remove me, only being used for Ember.run.sync
  flush: function() {
    var queue = this._queue;
    var globalOptions = this.globalOptions;
    var options = this.options;
    var before = options && options.before;
    var after = options && options.after;
    var onError = globalOptions.onError || (globalOptions.onErrorTarget && globalOptions.onErrorTarget[globalOptions.onErrorMethod]);
    var target, method, args, stack, i, l = queue.length;

    this.targetQueues = Object.create(null);

    if (l && before) { before(); }
    for (i = 0; i < l; i += 4) {
      target = queue[i];
      method = queue[i+1];
      args   = queue[i+2];
      stack  = queue[i+3]; // Debugging assistance

      // TODO: error handling
      if (args && args.length > 0) {
        if (onError) {
          try {
            method.apply(target, args);
          } catch (e) {
            onError(e);
          }
        } else {
          method.apply(target, args);
        }
      } else {
        if (onError) {
          try {
            method.call(target);
          } catch(e) {
            onError(e);
          }
        } else {
          method.call(target);
        }
      }
    }
    if (l && after) { after(); }

    // check if new items have been added
    if (queue.length > l) {
      this._queue = queue.slice(l);
      this.flush();
    } else {
      this._queue.length = 0;
    }
  },

  cancel: function(actionToCancel) {
    var queue = this._queue, currentTarget, currentMethod, i, l;

    for (i = 0, l = queue.length; i < l; i += 4) {
      currentTarget = queue[i];
      currentMethod = queue[i+1];

      if (currentTarget === actionToCancel.target && currentMethod === actionToCancel.method) {
        queue.splice(i, 4);
        return true;
      }
    }

    // if not found in current queue
    // could be in the queue that is being flushed
    queue = this._queueBeingFlushed;
    if (!queue) {
      return;
    }
    for (i = 0, l = queue.length; i < l; i += 4) {
      currentTarget = queue[i];
      currentMethod = queue[i+1];

      if (currentTarget === actionToCancel.target && currentMethod === actionToCancel.method) {
        // don't mess with array during flush
        // just nullify the method
        queue[i+1] = null;
        return true;
      }
    }
  }
};

export default Queue;
