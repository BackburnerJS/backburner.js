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
    var queue = this._queue,
        action = [target, method, args, stack];
    queue.push(action);
    return {queue: this, action: action};
  },

  shift: function() {
    return this._queue.shift();
  },

  pushUnique: function(target, method, args, stack) {
    var queue = this._queue, action;

    for (var i = 0, l = queue.length; i < l; i++) {
      action = queue[i];

      if (action[0] === target && action[1] === method) {
        action[2] = args; // replace args
        action[3] = stack; // replace stack
        return {queue: this, action: action}; // TODO: test this code path
      }
    }

    action = [target, method, args, stack];
    this._queue.push(action);
    return {queue: this, action: action};
  },

  // remove me, only being used for Ember.run.sync
  flush: function() {
    var queue = this._queue,
        options = this.options,
        before = options && options.before,
        after = options && options.after,
        action, target, method, args, i, l;

    if (before) { before(); }
    for (i = 0; i < queue.length; i++) {
      action = queue[i];
      target = action[0];
      method = action[1];
      args   = action[2];

      method.apply(target, args); // TODO: error handling
    }
    if (after) { after(); }

    // FIXME: if length is 0, don't recreate array
    this._queue = [];
  },

  cancel: function(actionToCancel) {
    var queue = this._queue, action, i, l;

    for (i = 0, l = queue.length; i < l; i++) {
      action = queue[i];

      if (action[0] === actionToCancel[0] && action[1] === actionToCancel[1]) {
        queue.splice(i, 1);
        return;
      }
    }
  },

  priorQueueWithActions: function() {
    var daq = this.daq,
        currentQueueIndex = daq.queueNames.indexOf(this.name),
        queueName, queue;

    for (var i = 0, l = currentQueueIndex; i <= l; i++) {
      queueName = daq.queueNames[i];
      queue = daq.queues[queueName];
      if (queue._queue.length) { return i; }
    }

    return -1;
  }
};

export Queue;