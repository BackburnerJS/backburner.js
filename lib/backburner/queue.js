function Queue(daq, name, options) {
  this.daq = daq;
  this.name = name;
  this.options = options;
  this._queue = [];
}

Queue.prototype = {
  daq: null,
  name: null,
  options: null,
  _queue: null,

  push: function(target, method, args, stack) {
    var queue = this._queue;
    queue.push(target, method, args, stack);
    return {queue: this, target: target, method: method};
  },

  pushUnique: function(target, method, args, stack) {
    var queue = this._queue, currentTarget, currentMethod, i, l;

    for (i = 0, l = queue.length; i < l; i += 4) {
      currentTarget = queue[i];
      currentMethod = queue[i+1];

      if (currentTarget === target && currentMethod === method) {
        queue[i+2] = args; // replace args
        queue[i+3] = stack; // replace stack
        return {queue: this, target: target, method: method}; // TODO: test this code path
      }
    }

    this._queue.push(target, method, args, stack);
    return {queue: this, target: target, method: method};
  },

  // TODO: remove me, only being used for Ember.run.sync
  flush: function() {
    var queue = this._queue,
        options = this.options,
        before = options && options.before,
        after = options && options.after,
        target, method, args, stack, i, l = queue.length;

    if (l && before) { before(); }
    for (i = 0; i < l; i += 4) {
      target = queue[i];
      method = queue[i+1];
      args   = queue[i+2];
      stack  = queue[i+3]; // Debugging assistance

      // TODO: error handling
      if (args && args.length > 0) {
        method.apply(target, args);
      } else {
        method.call(target);
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

export { Queue };
