(function(globals) {
var define, requireModule;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requireModule = function(name) {
    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(deps[i]));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;
  };
})();

define("backburner",
  ["exports"],
  function(__exports__) {
    "use strict";
    var slice = [].slice,
        pop = [].pop,
        DeferredActionQueues,
        debouncees = [],
        timers = [],
        autorun, laterTimer, laterTimerExpiresAt;

    function Backburner(queueNames, options) {
      this.queueNames = queueNames;
      this.options = options || {};
    }

    Backburner.prototype = {
      queueNames: null,
      options: null,
      currentInstance: null,
      previousInstance: null,

      begin: function() {
        if (this.currentInstance) {
          this.previousInstance = this.currentInstance;
        }
        this.currentInstance = new DeferredActionQueues(this.queueNames, this.options);
      },

      end: function() {
        try {
          this.currentInstance.flush();
        } finally {
          this.currentInstance = null;
          if (this.previousInstance) {
            this.currentInstance = this.previousInstance;
            this.previousInstance = null;
          }
        }
      },

      run: function(target, method /*, args */) {
        var ret;
        this.begin();

        if (!method) {
          method = target;
          target = null;
        }

        if (typeof method === 'string') {
          method = target[method];
        }

        var args = arguments.length > 2 ? slice.call(arguments, 2) : undefined;
        try {
          ret = method.apply(target, args);
        } finally {
          this.end();
        }
        return ret;
      },

      defer: function(queueName, target, method /* , args */) {
        // TODO: assert args?
        var stack = new Error().stack,
            args = arguments.length > 3 ? slice.call(arguments, 3) : undefined;
        if (!this.currentInstance) { createAutorun(this); }
        return this.currentInstance.schedule(queueName, target, method, args, false, stack);
      },

      deferOnce: function(queueName, target, method /* , args */) {
        // TODO: assert args?
        var stack = new Error().stack,
            args = arguments.length > 3 ? slice.call(arguments, 3) : undefined;
        if (!this.currentInstance) { createAutorun(this); }
        return this.currentInstance.schedule(queueName, target, method, args, true, stack);
      },

      next: function() {
        var self = this,
            args = slice.call(arguments);
        args.push(1);
        return this.later.apply(self, args);
      },

      setTimeout: function() {
        var self = this,
            wait = pop.call(arguments),
            target = arguments[0],
            method = arguments[1],
            executeAt = (+new Date()) + wait;

        if (!method) {
          method = target;
          target = null;
        }

        if (typeof method === 'string') {
          method = target[method];
        }

        var args = arguments.length > 2 ? slice.call(arguments, 2) : undefined;

        // find position to insert - TODO: binary search
        var i, l;
        for (i = 0, l = timers.length; i < l; i += 2) {
          if (executeAt < timers[i]) { break; }
        }

        var fn = function() {
          method.apply(target, args);
        };
        timers.splice(i, 0, executeAt, fn);

        if (laterTimer && laterTimerExpiresAt < executeAt) { return fn; }

        if (laterTimer) {
          clearTimeout(laterTimer);
          laterTimer = null;
        }
        laterTimer = setTimeout(function() {
          executeTimers(self);
          laterTimer = null;
          laterTimerExpiresAt = null;
        }, wait);
        laterTimerExpiresAt = executeAt;

        return fn;
      },

      debounce: function(target, method /* , args, wait */) {
        var self = this,
            args = arguments,
            wait = pop.call(args),
            debouncee;

        for (var i = 0, l = debouncees.length; i < l; i++) {
          debouncee = debouncees[i];
          if (debouncee[0] === target && debouncee[1] === method) { return; } // do nothing
        }

        var timer = setTimeout(function() {
          self.run.apply(self, args);

          // remove debouncee
          var index = -1;
          for (var i = 0, l = debouncees.length; i < l; i++) {
            debouncee = debouncees[i];
            if (debouncee[0] === target && debouncee[1] === method) {
              index = i;
              break;
            }
          }

          if (index > -1) { debouncees.splice(index, 1); }
        }, wait);

        debouncees.push([target, method, timer]);
      },

      cancelTimers: function() {
        for (var i = 0, l = debouncees.length; i < l; i++) {
          clearTimeout(debouncees[i][2]);
        }
        debouncees = [];

        if (laterTimer) {
          clearTimeout(laterTimer);
          laterTimer = null;
        }
        timers = [];

        if (autorun) { clearTimeout(autorun); }
      },

      hasTimers: function() {
        return !!timers.length && !autorun;
      },

      cancel: function(timer) {
        if (typeof timer === 'object' && timer.queue && timer.action) { // we're cancelling a once
          timer.queue.cancel(timer.action);
        } else if (typeof timer === 'function') { // we're cancelling a later fn
          for (var i = 0, l = timers.length; i < l; i += 2) {
            if (timers[i + 1] === timer) {
              timers.splice(i, 2); // remove the two elements
              return;
            }
          }
        }
      }
    };

    Backburner.prototype.schedule = Backburner.prototype.defer;
    Backburner.prototype.scheduleOnce = Backburner.prototype.deferOnce;
    Backburner.prototype.later = Backburner.prototype.setTimeout;

    function createAutorun(backburner) {
      backburner.begin();
      autorun = setTimeout(function() {
        backburner.end();
      });
    }

    function executeTimers(self) {
      var now = +new Date(),
          time, fns, i, l;

      self.run(function() {
        // TODO: binary search
        for (i = 0, l = timers.length; i < l; i += 2) {
          time = timers[i];
          if (time > now) { break; }
        }

        fns = timers.splice(0, i);

        for (i = 1, l = fns.length; i < l; i += 2) {
          self.schedule(self.queueNames[0], null, fns[i]); // TODO: make default queue configurable
        }
      });

      if (timers.length) {
        laterTimer = setTimeout(function() {
          executeTimers(self);
        }, timers[0] - now);
        laterTimerExpiresAt = timers[0];
      }
    }

    DeferredActionQueues = function(queueNames, options) {
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

    __exports__.Backburner = Backburner;
  });
window.backburner = requireModule("backburner");
})(window);