import {
  each,
  isString,
  isFunction,
  isNumber,
  isCoercableNumber,
  wrapInTryCatch
} from "backburner/utils";

import {
   needsIETryCatchFix
} from "backburner/platform";

import searchTimer from "backburner/binary-search";

import DeferredActionQueues from "backburner/deferred-action-queues";

var slice = [].slice;
var pop = [].pop;
var global = this;

function Backburner(queueNames, options) {
  this.queueNames = queueNames;
  this.options = options || {};
  if (!this.options.defaultQueue) {
    this.options.defaultQueue = queueNames[0];
  }
  this.instanceStack = [];
  this._debouncees = [];
  this._throttlers = [];
  this._timers = [];
}

Backburner.prototype = {
  begin: function() {
    var options = this.options;
    var onBegin = options && options.onBegin;
    var previousInstance = this.currentInstance;

    if (previousInstance) {
      this.instanceStack.push(previousInstance);
    }

    this.currentInstance = new DeferredActionQueues(this.queueNames, options);
    if (onBegin) {
      onBegin(this.currentInstance, previousInstance);
    }
  },

  end: function() {
    var options = this.options;
    var onEnd = options && options.onEnd;
    var currentInstance = this.currentInstance;
    var nextInstance = null;

    // Prevent double-finally bug in Safari 6.0.2 and iOS 6
    // This bug appears to be resolved in Safari 6.0.5 and iOS 7
    var finallyAlreadyCalled = false;
    try {
      currentInstance.flush();
    } finally {
      if (!finallyAlreadyCalled) {
        finallyAlreadyCalled = true;

        this.currentInstance = null;

        if (this.instanceStack.length) {
          nextInstance = this.instanceStack.pop();
          this.currentInstance = nextInstance;
        }

        if (onEnd) {
          onEnd(currentInstance, nextInstance);
        }
      }
    }
  },

  run: function(target, method /*, args */) {
    var onError = getOnError(this.options);

    this.begin();

    if (!method) {
      method = target;
      target = null;
    }

    if (isString(method)) {
      method = target[method];
    }

    var args = slice.call(arguments, 2);

    // guard against Safari 6's double-finally bug
    var didFinally = false;

    if (onError) {
      try {
        return method.apply(target, args);
      } catch(error) {
        onError(error);
      } finally {
        if (!didFinally) {
          didFinally = true;
          this.end();
        }
      }
    } else {
      try {
        return method.apply(target, args);
      } finally {
        if (!didFinally) {
          didFinally = true;
          this.end();
        }
      }
    }
  },

  defer: function(queueName, target, method /* , args */) {
    if (!method) {
      method = target;
      target = null;
    }

    if (isString(method)) {
      method = target[method];
    }

    var stack = this.DEBUG ? new Error() : undefined;
    var length = arguments.length;
    var args;

    if (length > 3) {
      args = new Array(length - 3);
      for (var i = 3; i < length; i++) {
        args[i-3] = arguments[i];
      }
    } else {
      args = undefined;
    }

    if (!this.currentInstance) { createAutorun(this); }
    return this.currentInstance.schedule(queueName, target, method, args, false, stack);
  },

  deferOnce: function(queueName, target, method /* , args */) {
    if (!method) {
      method = target;
      target = null;
    }

    if (isString(method)) {
      method = target[method];
    }

    var stack = this.DEBUG ? new Error() : undefined;
    var length = arguments.length;
    var args;

    if (length > 3) {
      args = new Array(length - 3);
      for (var i = 3; i < length; i++) {
        args[i-3] = arguments[i];
      }
    } else {
      args = undefined;
    }

    if (!this.currentInstance) {
      createAutorun(this);
    }
    return this.currentInstance.schedule(queueName, target, method, args, true, stack);
  },

  setTimeout: function() {
    var l = arguments.length;
    var args = new Array(l);
    for (var x = 0; x < l; x++) {
      args[x] = arguments[x];
    }
    var length = args.length,
        method, wait, target,
        methodOrTarget, methodOrWait, methodOrArgs;

    if (length === 0) {
      return;
    } else if (length === 1) {
      method = args.shift();
      wait = 0;
    } else if (length === 2) {
      methodOrTarget = args[0];
      methodOrWait = args[1];

      if (isFunction(methodOrWait) || isFunction(methodOrTarget[methodOrWait])) {
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
      } else {
        wait = 0;
      }

      methodOrTarget = args[0];
      methodOrArgs = args[1];

      if (isFunction(methodOrArgs) || (isString(methodOrArgs) &&
                                      methodOrTarget !== null &&
                                      methodOrArgs in methodOrTarget)) {
        target = args.shift();
        method = args.shift();
      } else {
        method = args.shift();
      }
    }

    var executeAt = (+new Date()) + parseInt(wait, 10);

    if (isString(method)) {
      method = target[method];
    }

    var onError = getOnError(this.options);

    function fn() {
      if (onError) {
        try {
          method.apply(target, args);
        } catch (e) {
          onError(e);
        }
      } else {
        method.apply(target, args);
      }
    }

    // find position to insert
    var i = searchTimer(executeAt, this._timers);

    this._timers.splice(i, 0, executeAt, fn);

    updateLaterTimer(this, executeAt, wait);

    return fn;
  },

  throttle: function(target, method /* , args, wait, [immediate] */) {
    var self = this;
    var args = arguments;
    var immediate = pop.call(args);
    var wait, throttler, index, timer;

    if (isNumber(immediate) || isString(immediate)) {
      wait = immediate;
      immediate = true;
    } else {
      wait = pop.call(args);
    }

    wait = parseInt(wait, 10);

    index = findThrottler(target, method, this._throttlers);
    if (index > -1) { return this._throttlers[index]; } // throttled

    timer = global.setTimeout(function() {
      if (!immediate) {
        self.run.apply(self, args);
      }
      var index = findThrottler(target, method, self._throttlers);
      if (index > -1) {
        self._throttlers.splice(index, 1);
      }
    }, wait);

    if (immediate) {
      self.run.apply(self, args);
    }

    throttler = [target, method, timer];

    this._throttlers.push(throttler);

    return throttler;
  },

  debounce: function(target, method /* , args, wait, [immediate] */) {
    var self = this;
    var args = arguments;
    var immediate = pop.call(args);
    var wait, index, debouncee, timer;

    if (isNumber(immediate) || isString(immediate)) {
      wait = immediate;
      immediate = false;
    } else {
      wait = pop.call(args);
    }

    wait = parseInt(wait, 10);
    // Remove debouncee
    index = findDebouncee(target, method, this._debouncees);

    if (index > -1) {
      debouncee = this._debouncees[index];
      this._debouncees.splice(index, 1);
      clearTimeout(debouncee[2]);
    }

    timer = global.setTimeout(function() {
      if (!immediate) {
        self.run.apply(self, args);
      }
      var index = findDebouncee(target, method, self._debouncees);
      if (index > -1) {
        self._debouncees.splice(index, 1);
      }
    }, wait);

    if (immediate && index === -1) {
      self.run.apply(self, args);
    }

    debouncee = [
      target,
      method,
      timer
    ];

    self._debouncees.push(debouncee);

    return debouncee;
  },

  cancelTimers: function() {
    var clearItems = function(item) {
      clearTimeout(item[2]);
    };

    each(this._throttlers, clearItems);
    this._throttlers = [];

    each(this._debouncees, clearItems);
    this._debouncees = [];

    if (this._laterTimer) {
      clearTimeout(this._laterTimer);
      this._laterTimer = null;
    }
    this._timers = [];

    if (this._autorun) {
      clearTimeout(this._autorun);
      this._autorun = null;
    }
  },

  hasTimers: function() {
    return !!this._timers.length || !!this._debouncees.length || !!this._throttlers.length || this._autorun;
  },

  cancel: function(timer) {
    var timerType = typeof timer;

    if (timer && timerType === 'object' && timer.queue && timer.method) { // we're cancelling a deferOnce
      return timer.queue.cancel(timer);
    } else if (timerType === 'function') { // we're cancelling a setTimeout
      for (var i = 0, l = this._timers.length; i < l; i += 2) {
        if (this._timers[i + 1] === timer) {
          this._timers.splice(i, 2); // remove the two elements
          if (i === 0) {
            if (this._laterTimer) { // Active timer? Then clear timer and reset for future timer
              clearTimeout(this._laterTimer);
              this._laterTimer = null;
            }
            if (this._timers.length > 0) { // Update to next available timer when available
              updateLaterTimer(this, this._timers[0], this._timers[0] - (+new Date()));
            }
          }
          return true;
        }
      }
    } else if (Object.prototype.toString.call(timer) === "[object Array]"){ // we're cancelling a throttle or debounce
      return this._cancelItem(findThrottler, this._throttlers, timer) ||
               this._cancelItem(findDebouncee, this._debouncees, timer);
    } else {
      return; // timer was null or not a timer
    }
  },

  _cancelItem: function(findMethod, array, timer){
    var item, index;

    if (timer.length < 3) { return false; }

    index = findMethod(timer[0], timer[1], array);

    if (index > -1) {

      item = array[index];

      if (item[2] === timer[2]) {
        array.splice(index, 1);
        clearTimeout(timer[2]);
        return true;
      }
    }

    return false;
  }
};

Backburner.prototype.schedule = Backburner.prototype.defer;
Backburner.prototype.scheduleOnce = Backburner.prototype.deferOnce;
Backburner.prototype.later = Backburner.prototype.setTimeout;

if (needsIETryCatchFix) {
  var originalRun = Backburner.prototype.run;
  Backburner.prototype.run = wrapInTryCatch(originalRun);

  var originalEnd = Backburner.prototype.end;
  Backburner.prototype.end = wrapInTryCatch(originalEnd);
}

function getOnError(options) {
  return options.onError || (options.onErrorTarget && options.onErrorTarget[options.onErrorMethod]);
}

function createAutorun(backburner) {
  backburner.begin();
  backburner._autorun = global.setTimeout(function() {
    backburner._autorun = null;
    backburner.end();
  });
}

function updateLaterTimer(self, executeAt, wait) {
  var now = (+new Date());
  if (!self._laterTimer || executeAt < self._laterTimerExpiresAt || self._laterTimerExpiresAt < now) {

    if (self._laterTimer) {
      // Clear when:
      // - Already expired
      // - New timer is earlier
      clearTimeout(self._laterTimer);

      if (self._laterTimerExpiresAt < now) { // If timer was never triggered
        // Calculate the left-over wait-time
        wait = Math.max(0, executeAt - now);
      }
    }

    self._laterTimer = global.setTimeout(function() {
      self._laterTimer = null;
      self._laterTimerExpiresAt = null;
      executeTimers(self);
    }, wait);

    self._laterTimerExpiresAt = now + wait;
  }
}

function executeTimers(self) {
  var now = +new Date();
  var fns, i, l;

  self.run(function() {
    i = searchTimer(now, self._timers);

    fns = self._timers.splice(0, i);

    for (i = 1, l = fns.length; i < l; i += 2) {
      self.schedule(self.options.defaultQueue, null, fns[i]);
    }
  });

  if (self._timers.length) {
    updateLaterTimer(self, self._timers[0], self._timers[0] - now);
  }
}

function findDebouncee(target, method, debouncees) {
  return findItem(target, method, debouncees);
}

function findThrottler(target, method, throttlers) {
  return findItem(target, method, throttlers);
}

function findItem(target, method, collection) {
  var item;
  var index = -1;

  for (var i = 0, l = collection.length; i < l; i++) {
    item = collection[i];
    if (item[0] === target && item[1] === method) {
      index = i;
      break;
    }
  }

  return index;
}

export default Backburner;
