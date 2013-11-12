import DeferredActionQueues from "backburner/deferred_action_queues";

var slice = [].slice,
    pop = [].pop,
    throttlers = [],
    debouncees = [],
    timers = [],
    autorun, laterTimer, laterTimerExpiresAt,
    global = this,
    NUMBER = /\d+/;

// In IE 6-8, try/finally doesn't work without a catch.
// Unfortunately, this is impossible to test for since wrapping it in a parent try/catch doesn't trigger the bug.
// This tests for another broken try/catch behavior that only exhibits in the same versions of IE.
var needsIETryCatchFix = (function(e,x){
  try{ x(); }
  catch(e) { } // jshint ignore:line
  return !!e;
})();

function isCoercableNumber(number) {
  return typeof number === 'number' || NUMBER.test(number);
}

function Backburner(queueNames, options) {
  this.queueNames = queueNames;
  this.options = options || {};
  if (!this.options.defaultQueue) {
    this.options.defaultQueue = queueNames[0];
  }
  this.instanceStack = [];
}

Backburner.prototype = {
  queueNames: null,
  options: null,
  currentInstance: null,
  instanceStack: null,

  begin: function() {
    var onBegin = this.options && this.options.onBegin,
        previousInstance = this.currentInstance;

    if (previousInstance) {
      this.instanceStack.push(previousInstance);
    }

    this.currentInstance = new DeferredActionQueues(this.queueNames, this.options);
    if (onBegin) {
      onBegin(this.currentInstance, previousInstance);
    }
  },

  end: function() {
    var onEnd = this.options && this.options.onEnd,
        currentInstance = this.currentInstance,
        nextInstance = null;

    var finallyAlreadyCalled = false,
        self = this;

    function doFinally() {
      try {
        currentInstance.flush();
      } finally {
        // Prevent double-finally bug in Safari 6.0.2 and iOS 6
        // This bug appears to be resolved in Safari 6.0.5 and iOS 7
        if (!finallyAlreadyCalled) {
          finallyAlreadyCalled = true;

          self.currentInstance = null;

          if (self.instanceStack.length) {
            nextInstance = self.instanceStack.pop();
            self.currentInstance = nextInstance;
          }

          if (onEnd) {
            onEnd(currentInstance, nextInstance);
          }
        }
      }
    }

    // In IE 6-8 try/finally doesn't work unless it also has a catch or is contained in a try/catch block.
    if (needsIETryCatchFix) {
      try {
        doFinally();
      } catch (e) {
        throw e;
      }
    } else {
      doFinally();
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

    if (arguments.length > 2) {
      var args = slice.call(arguments, 2);
      this.schedule(this.options.defaultQueue, null, function () {
        ret = method.apply(target, args);
      });
    } else {
      this.schedule(this.options.defaultQueue, null, function () {
        ret = method.call(target);
      });
    }

    this.end();

    return ret;
  },

  defer: function(queueName, target, method /* , args */) {
    if (!method) {
      method = target;
      target = null;
    }

    if (typeof method === 'string') {
      method = target[method];
    }

    var stack = this.DEBUG ? new Error().stack : undefined,
        args = arguments.length > 3 ? slice.call(arguments, 3) : undefined;
    if (!this.currentInstance) { createAutorun(this); }
    return this.currentInstance.schedule(queueName, target, method, args, false, stack);
  },

  deferOnce: function(queueName, target, method /* , args */) {
    if (!method) {
      method = target;
      target = null;
    }

    if (typeof method === 'string') {
      method = target[method];
    }

    var stack = this.DEBUG ? new Error().stack : undefined,
        args = arguments.length > 3 ? slice.call(arguments, 3) : undefined;
    if (!this.currentInstance) { createAutorun(this); }
    return this.currentInstance.schedule(queueName, target, method, args, true, stack);
  },

  setTimeout: function() {
    var args = slice.call(arguments);
    var length = args.length;
    var method, wait, target;
    var self = this;
    var methodOrTarget, methodOrWait, methodOrArgs;

    if (length === 0) {
      return;
    } else if (length === 1) {
      method = args.shift();
      wait = 0;
    } else if (length === 2) {
      methodOrTarget = args[0];
      methodOrWait = args[1];

      if (typeof methodOrWait === 'function' || typeof  methodOrTarget[methodOrWait] === 'function') {
        target = args.shift();
        method = args.shift();
        wait = 0;
      } else if (isCoercableNumber(methodOrWait)) {
        method = args.shift();
        wait = args.shift();
      } else {
        method = args.shift();
        wait =  0;
      }
    } else {
      var last = args[args.length - 1];

      if (isCoercableNumber(last)) {
        wait = args.pop();
      }

      methodOrTarget = args[0];
      methodOrArgs = args[1];

      if (typeof methodOrArgs === 'function' || (typeof methodOrArgs === 'string' &&
                                                 methodOrTarget !== null &&
                                                 methodOrArgs in methodOrTarget)) {
        target = args.shift();
        method = args.shift();
      } else {
        method = args.shift();
      }
    }

    var executeAt = (+new Date()) + parseInt(wait, 10);

    if (typeof method === 'string') {
      method = target[method];
    }

    function fn() {
      method.apply(target, args);
    }

    // find position to insert - TODO: binary search
    var i, l;
    for (i = 0, l = timers.length; i < l; i += 2) {
      if (executeAt < timers[i]) { break; }
    }

    timers.splice(i, 0, executeAt, fn);

    updateLaterTimer(self, executeAt, wait);

    return fn;
  },

  throttle: function(target, method /* , args, wait */) {
    var self = this,
        args = arguments,
        wait = parseInt(pop.call(args), 10),
        throttler;

    for (var i = 0, l = throttlers.length; i < l; i++) {
      throttler = throttlers[i];
      if (throttler[0] === target && throttler[1] === method) { return; } // do nothing
    }

    var timer = global.setTimeout(function() {
      self.run.apply(self, args);

      // remove throttler
      var index = -1;
      for (var i = 0, l = throttlers.length; i < l; i++) {
        throttler = throttlers[i];
        if (throttler[0] === target && throttler[1] === method) {
          index = i;
          break;
        }
      }

      if (index > -1) { throttlers.splice(index, 1); }
    }, wait);

    throttlers.push([target, method, timer]);
  },

  debounce: function(target, method /* , args, wait, [immediate] */) {
    var self = this,
        args = arguments,
        immediate = pop.call(args),
        wait,
        index,
        debouncee;

    if (typeof immediate === "number" || typeof immediate === "string") {
      wait = immediate;
      immediate = false;
    } else {
      wait = pop.call(args);
    }

    wait = parseInt(wait, 10);
    // Remove debouncee
    index = findDebouncee(target, method);

    if (index !== -1) {
      debouncee = debouncees[index];
      debouncees.splice(index, 1);
      clearTimeout(debouncee[2]);
    }

    var timer = global.setTimeout(function() {
      if (!immediate) {
        self.run.apply(self, args);
      }
      index = findDebouncee(target, method);
      if (index) {
        debouncees.splice(index, 1);
      }
    }, wait);

    if (immediate && index === -1) {
      self.run.apply(self, args);
    }

    debouncees.push([target, method, timer]);
  },

  cancelTimers: function() {
    var i, len;

    for (i = 0, len = throttlers.length; i < len; i++) {
      clearTimeout(throttlers[i][2]);
    }
    throttlers = [];

    for (i = 0, len = debouncees.length; i < len; i++) {
      clearTimeout(debouncees[i][2]);
    }
    debouncees = [];

    if (laterTimer) {
      clearTimeout(laterTimer);
      laterTimer = null;
    }
    timers = [];

    if (autorun) {
      clearTimeout(autorun);
      autorun = null;
    }
  },

  hasTimers: function() {
    return !!timers.length || autorun;
  },

  cancel: function(timer) {
    if (timer && typeof timer === 'object' && timer.queue && timer.method) { // we're cancelling a deferOnce
      return timer.queue.cancel(timer);
    } else if (typeof timer === 'function') { // we're cancelling a setTimeout
      for (var i = 0, l = timers.length; i < l; i += 2) {
        if (timers[i + 1] === timer) {
          timers.splice(i, 2); // remove the two elements
          return true;
        }
      }
    } else {
      return; // timer was null or not a timer
    }
  }
};

Backburner.prototype.schedule = Backburner.prototype.defer;
Backburner.prototype.scheduleOnce = Backburner.prototype.deferOnce;
Backburner.prototype.later = Backburner.prototype.setTimeout;

function createAutorun(backburner) {
  backburner.begin();
  autorun = global.setTimeout(function() {
    autorun = null;
    backburner.end();
  });
}

function updateLaterTimer(self, executeAt, wait) {
  if (!laterTimer || executeAt < laterTimerExpiresAt) {
    if (laterTimer) {
      clearTimeout(laterTimer);
    }
    laterTimer = global.setTimeout(function() {
      laterTimer = null;
      laterTimerExpiresAt = null;
      executeTimers(self);
    }, wait);
    laterTimerExpiresAt = executeAt;
  }
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
      self.schedule(self.options.defaultQueue, null, fns[i]);
    }
  });

  if (timers.length) {
    updateLaterTimer(self, timers[0], timers[0] - now);
  }
}

function findDebouncee(target, method) {
  var debouncee,
      index = -1;

  for (var i = 0, l = debouncees.length; i < l; i++) {
    debouncee = debouncees[i];
    if (debouncee[0] === target && debouncee[1] === method) {
      index = i;
      break;
    }
  }

  return index;
}

export Backburner;
