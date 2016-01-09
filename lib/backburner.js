import {
  each,
  isString,
  isFunction,
  isNumber,
  isCoercableNumber,
  wrapInTryCatch,
  now
} from './backburner/utils';

import platform, {
   needsIETryCatchFix
} from './backburner/platform';

import searchTimer from './backburner/binary-search';

import DeferredActionQueues from './backburner/deferred-action-queues';

export default function Backburner(queueNames, options) {
  this.queueNames = queueNames;
  this.options = options || {};
  if (!this.options.defaultQueue) {
    this.options.defaultQueue = queueNames[0];
  }
  this.instanceStack = [];
  this._debouncees = [];
  this._throttlers = [];
  this._eventCallbacks = {
    end: [],
    begin: []
  };

  this._timerTimeoutId = undefined;
  this._timers = [];

  var _this = this;
  this._boundRunExpiredTimers = function () {
    _this._runExpiredTimers();
  };

  this.yieldFilter = options && options.yieldFilter || null;
  this.yieldInterval = options && options.yieldInterval || 0;
  this.onBurnCycle = options && options.onBurnCycle;
  this.onNext = options && options.onNext;
  this.burnCycleStartTime = 0; // TODO: move to local var
}

// ms of delay before we conclude a timeout was lost
var TIMEOUT_STALLED_THRESHOLD = 1000;

Backburner.prototype = {
  begin: function() {
    var options = this.options;
    var onBegin = options && options.onBegin;
    var previousInstance = this.currentInstance;

    if (previousInstance) {
      this.instanceStack.push(previousInstance);
    }

    this.currentInstance = new DeferredActionQueues(this.queueNames, options);
    this._trigger('begin', this.currentInstance, previousInstance);
    if (onBegin) {
      onBegin(this.currentInstance, previousInstance);
    }
  },

  getYieldInterval: function() {
    return this.yieldInterval;
  },

  getTime: function() {
    return new Date().getTime();
  },

  burnCycle: function() {
    var startTime = this.getTime();
    var endTime = startTime;
    var result = {};
    var currentInstance = this.currentInstance;
    var that = this;

    if (!this.burnCycleStartTime) {
      this.burnCycleStartTime = startTime;
    }

    while (!result.done && startTime > endTime - this.getYieldInterval()) {
      result = currentInstance.next();
      endTime = this.getTime();
    }

    if (this.onNext) {
      this.onNext({
        selfTime: endTime - startTime,
        currentInstance: currentInstance,
        result: result
      });
    }

    if (!result.done){
      if (!this.yieldFilter || this.yieldFilter(currentInstance)) {
        setTimeout(function () {
          that.burnCycle();
        }, 0);
      } else {
        that.burnCycle();
      }
    } else {
      if (this.onBurnCycle) {
        this.onBurnCycle({
          selfTime: endTime - this.burnCycleStartTime,
          currentInstance: currentInstance
        });
      }
      this.burnCycleStartTime = 0;
      this.popInstanceStack();
    }
  },

  startBurnCycle: function() {
    this.burnCycle();
  },

  end: function() {
    var currentInstance = this.currentInstance;

    if (this.getYieldInterval()) {
      this.startBurnCycle();
      return;
    }

    // Prevent double-finally bug in Safari 6.0.2 and iOS 6
    // This bug appears to be resolved in Safari 6.0.5 and iOS 7
    var finallyAlreadyCalled = false;
    try {
      currentInstance.flush();
    } finally {
      if (!finallyAlreadyCalled) {
        finallyAlreadyCalled = true;
        this.popInstanceStack();
      }
    }
  },

  popInstanceStack: function() {
    var options = this.options;
    var onEnd = options && options.onEnd;
    var nextInstance = null;
    var currentInstance = this.currentInstance;
    this.currentInstance = null;

    if (this.instanceStack.length) {
      nextInstance = this.instanceStack.pop();
      this.currentInstance = nextInstance;
    }
    this._trigger('end', currentInstance, nextInstance);
    if (onEnd) {
      onEnd(currentInstance, nextInstance);
    }
  },


  /**
   Trigger an event. Supports up to two arguments. Designed around
   triggering transition events from one run loop instance to the
   next, which requires an argument for the first instance and then
   an argument for the next instance.

   @private
   @method _trigger
   @param {String} eventName
   @param {any} arg1
   @param {any} arg2
   */
  _trigger: function(eventName, arg1, arg2) {
    var callbacks = this._eventCallbacks[eventName];
    if (callbacks) {
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](arg1, arg2);
      }
    }
  },

  on: function(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }
    var callbacks = this._eventCallbacks[eventName];
    if (callbacks) {
      callbacks.push(callback);
    } else {
      throw new TypeError('Cannot on() event "' + eventName + '" because it does not exist');
    }
  },

  off: function(eventName, callback) {
    if (eventName) {
      var callbacks = this._eventCallbacks[eventName];
      var callbackFound = false;
      if (!callbacks) return;
      if (callback) {
        for (var i = 0; i < callbacks.length; i++) {
          if (callbacks[i] === callback) {
            callbackFound = true;
            callbacks.splice(i, 1);
            i--;
          }
        }
      }
      if (!callbackFound) {
        throw new TypeError('Cannot off() callback that does not exist');
      }
    } else {
      throw new TypeError('Cannot off() event "' + eventName + '" because it does not exist');
    }
  },

  run: function(/* target, method, args */) {
    var length = arguments.length;
    var method, target, args;

    if (length === 1) {
      method = arguments[0];
      target = null;
    } else {
      target = arguments[0];
      method = arguments[1];
    }

    if (isString(method)) {
      method = target[method];
    }

    if (length > 2) {
      args = new Array(length - 2);
      for (var i = 0, l = length - 2; i < l; i++) {
        args[i] = arguments[i + 2];
      }
    } else {
      args = [];
    }

    var onError = getOnError(this.options);

    this.begin();

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

  /*
    Join the passed method with an existing queue and execute immediately,
    if there isn't one use `Backburner#run`.

    The join method is like the run method except that it will schedule into
    an existing queue if one already exists. In either case, the join method will
    immediately execute the passed in function and return its result.

    @method join
    @param {Object} target
    @param {Function} method The method to be executed
    @param {any} args The method arguments
    @return method result
  */
  join: function(/* target, method, args */) {
    if (!this.currentInstance) {
      return this.run.apply(this, arguments);
    }

    var length = arguments.length;
    var method, target;

    if (length === 1) {
      method = arguments[0];
      target = null;
    } else {
      target = arguments[0];
      method = arguments[1];
    }

    if (isString(method)) {
      method = target[method];
    }

    if (length === 1) {
      return method();
    } else if (length === 2) {
      return method.call(target);
    } else {
      var args = new Array(length - 2);
      for (var i = 0, l = length - 2; i < l; i++) {
        args[i] = arguments[i + 2];
      }
      return method.apply(target, args);
    }
  },


  /*
    Defer the passed function to run inside the specified queue.

    @method defer
    @param {String} queueName
    @param {Object} target
    @param {Function|String} method The method or method name to be executed
    @param {any} args The method arguments
    @return method result
  */
  defer: function(queueName /* , target, method, args */) {
    var length = arguments.length;
    var method, target, args;

    if (length === 2) {
      method = arguments[1];
      target = null;
    } else {
      target = arguments[1];
      method = arguments[2];
    }

    if (isString(method)) {
      method = target[method];
    }

    var stack = this.DEBUG ? new Error() : undefined;

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

  deferOnce: function(queueName /* , target, method, args */) {
    var length = arguments.length;
    var method, target, args;

    if (length === 2) {
      method = arguments[1];
      target = null;
    } else {
      target = arguments[1];
      method = arguments[2];
    }

    if (isString(method)) {
      method = target[method];
    }

    var stack = this.DEBUG ? new Error() : undefined;

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

    var executeAt = now() + parseInt(wait, 10);

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

    return this._setTimeout(fn, executeAt);
  },

  _setTimeout: function (fn, executeAt) {
    if (this._timers.length === 0) {
      this._timers.push(executeAt, fn);
      this._installTimerTimeout();
      return fn;
    }

    this._reinstallStalledTimerTimeout();

    // find position to insert
    var i = searchTimer(executeAt, this._timers);

    this._timers.splice(i, 0, executeAt, fn);

    // we should be the new earliest timer if i == 0
    if (i === 0) {
      this._reinstallTimerTimeout();
    }

    return fn;
  },

  throttle: function(target, method /* , args, wait, [immediate] */) {
    var backburner = this;
    var args = new Array(arguments.length);
    for (var i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }
    var immediate = args.pop();
    var wait, throttler, index, timer;

    if (isNumber(immediate) || isString(immediate)) {
      wait = immediate;
      immediate = true;
    } else {
      wait = args.pop();
    }

    wait = parseInt(wait, 10);

    index = findThrottler(target, method, this._throttlers);
    if (index > -1) { return this._throttlers[index]; } // throttled

    timer = platform.setTimeout(function() {
      if (!immediate) {
        backburner.run.apply(backburner, args);
      }
      var index = findThrottler(target, method, backburner._throttlers);
      if (index > -1) {
        backburner._throttlers.splice(index, 1);
      }
    }, wait);

    if (immediate) {
      this.run.apply(this, args);
    }

    throttler = [target, method, timer];

    this._throttlers.push(throttler);

    return throttler;
  },

  debounce: function(target, method /* , args, wait, [immediate] */) {
    var backburner = this;
    var args = new Array(arguments.length);
    for (var i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    var immediate = args.pop();
    var wait, index, debouncee, timer;

    if (isNumber(immediate) || isString(immediate)) {
      wait = immediate;
      immediate = false;
    } else {
      wait = args.pop();
    }

    wait = parseInt(wait, 10);
    // Remove debouncee
    index = findDebouncee(target, method, this._debouncees);

    if (index > -1) {
      debouncee = this._debouncees[index];
      this._debouncees.splice(index, 1);
      clearTimeout(debouncee[2]);
    }

    timer = platform.setTimeout(function() {
      if (!immediate) {
        backburner.run.apply(backburner, args);
      }
      var index = findDebouncee(target, method, backburner._debouncees);
      if (index > -1) {
        backburner._debouncees.splice(index, 1);
      }
    }, wait);

    if (immediate && index === -1) {
      backburner.run.apply(backburner, args);
    }

    debouncee = [
      target,
      method,
      timer
    ];

    backburner._debouncees.push(debouncee);

    return debouncee;
  },

  cancelTimers: function() {
    each(this._throttlers, clearItems);
    this._throttlers = [];

    each(this._debouncees, clearItems);
    this._debouncees = [];

    this._clearTimerTimeout();
    this._timers = [];

    if (this._autorun) {
      clearTimeout(this._autorun);
      this._autorun = null;
    }
  },

  hasTimers: function() {
    return !!this._timers.length || !!this._debouncees.length || !!this._throttlers.length || this._autorun;
  },

  cancel: function (timer) {
    var timerType = typeof timer;

    if (timer && timerType === 'object' && timer.queue && timer.method) { // we're cancelling a deferOnce
      return timer.queue.cancel(timer);
    } else if (timerType === 'function') { // we're cancelling a setTimeout
      for (var i = 0, l = this._timers.length; i < l; i += 2) {
        if (this._timers[i + 1] === timer) {
          this._timers.splice(i, 2); // remove the two elements
          if (i === 0) {
            this._reinstallTimerTimeout();
          }
          return true;
        }
      }
    } else if (Object.prototype.toString.call(timer) === '[object Array]'){ // we're cancelling a throttle or debounce
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
  },

  _runExpiredTimers: function () {
    this._timerTimeoutId = undefined;
    this.run(this, this._scheduleExpiredTimers);
  },

  _scheduleExpiredTimers: function () {
    var n = now();
    var timers = this._timers;
    var i = 0;
    var l = timers.length;
    for (; i < l; i += 2) {
      var executeAt = timers[i];
      var fn = timers[i+1];
      if (executeAt <= n) {
        this.schedule(this.options.defaultQueue, null, fn);
      } else {
        break;
      }
    }
    timers.splice(0, i);
    this._installTimerTimeout();
  },

  _reinstallStalledTimerTimeout: function () {
    if (!this._timerTimeoutId) {
      return;
    }
    // if we have a timer we should always have a this._timerTimeoutId
    var minExpiresAt = this._timers[0];
    var delay = now() - minExpiresAt;
    // threshold of a second before we assume that the currently
    // installed timeout will not run, so we don't constantly reinstall
    // timeouts that are delayed but good still
    if (delay < TIMEOUT_STALLED_THRESHOLD) {
      return;
    }
  },

  _reinstallTimerTimeout: function () {
    this._clearTimerTimeout();
    this._installTimerTimeout();
  },

  _clearTimerTimeout: function () {
    if (!this._timerTimeoutId) {
      return;
    }
    clearTimeout(this._timerTimeoutId);
    this._timerTimeoutId = undefined;
  },

  _installTimerTimeout: function () {
    if (!this._timers.length) {
      return;
    }
    var minExpiresAt = this._timers[0];
    var n = now();
    var wait = Math.max(0, minExpiresAt - n);
    this._timerTimeoutId = setTimeout(this._boundRunExpiredTimers, wait);
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
  backburner._autorun = platform.setTimeout(function() {
    backburner._autorun = null;
    backburner.end();
  });
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

function clearItems(item) {
  clearTimeout(item[2]);
}

