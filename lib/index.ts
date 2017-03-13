import {
  each,
  findDebouncee,
  findItem,
  findThrottler,
  getOnError,
  isCoercableNumber,
  isFunction,
  isNumber,
  isString,
  now
} from './backburner/utils';

import searchTimer from './backburner/binary-search';
import DeferredActionQueues from './backburner/deferred-action-queues';

import Queue, { PAUSE } from './backburner/queue';

export default class Backburner {
  public static Queue = Queue;

  public DEBUG = false;

  public currentInstance: DeferredActionQueues | null | undefined;

  public schedule: Function;
  public scheduleOnce: Function;
  public later: Function;

  public options: any;

  private queueNames: string[];
  private instanceStack: DeferredActionQueues[];
  private _debouncees: any[];
  private _throttlers: any[];
  private _eventCallbacks: {
    end: Function[];
    begin: Function[];
  };

  private _boundClearItems: (item) => void;
  private _timerTimeoutId: number | undefined;
  private _timers: any[];
  private _platform: {
    setTimeout(fn: () => void, ms: number): number;
    clearTimeout(id: number): void;
    next(fn: () => void): number;
    clearNext(number): void;
  };

  private _boundRunExpiredTimers: () => void;

  private _autorun: number | null = null;
  private _boundAutorunEnd: () => void;

  constructor(queueNames: string[], options?: any) {
    this.queueNames = queueNames;
    this.options = options || {};
    if (!this.options.defaultQueue) {
      this.options.defaultQueue = queueNames[0];
    }
    this.currentInstance = null;
    this.instanceStack = [];
    this._debouncees = [];
    this._throttlers = [];
    this._eventCallbacks = {
      end: [],
      begin: []
    };

    this._boundClearItems = (item) => {
      this._platform.clearTimeout(item[2]);
    };

    this._timerTimeoutId = undefined;
    this._timers = [];

    this._platform = this.options._platform || {
      setTimeout(fn, ms) {
        return setTimeout(fn, ms);
      },
      clearTimeout(id) {
        clearTimeout(id);
      },
      next(fn) {
        // TODO: asap
        return setTimeout(fn, 0);
      },
      clearNext(fn) {
        clearTimeout(fn);
      }
    };

    this._boundRunExpiredTimers = () => {
      this._runExpiredTimers();
    };

    this._boundAutorunEnd = () => {
      this._autorun = null;
      this.end();
    };
  }

  public begin(): DeferredActionQueues {
    let options = this.options;
    let onBegin = options && options.onBegin;
    let previousInstance = this.currentInstance;

    if (previousInstance) {
      this.instanceStack.push(previousInstance);
    }

    const current = this.currentInstance = new DeferredActionQueues(this.queueNames, options);
    this._trigger('begin', current, previousInstance);
    if (onBegin) {
      onBegin(current, previousInstance);
    }
    return current;
  }

  public end() {
    let options = this.options;
    let onEnd = options && options.onEnd;
    let currentInstance = this.currentInstance;
    let nextInstance: DeferredActionQueues | null | undefined = null;

    if (!currentInstance) {
      throw new Error(`end called without begin`);
    }

    // Prevent double-finally bug in Safari 6.0.2 and iOS 6
    // This bug appears to be resolved in Safari 6.0.5 and iOS 7
    let finallyAlreadyCalled = false;
    let result;
    try {
      result = currentInstance.flush();
    } finally {
      if (!finallyAlreadyCalled) {
        finallyAlreadyCalled = true;

        if (result === PAUSE) {
          const next = this._platform.next;
          this._autorun = next(this._boundAutorunEnd);
          return;
        }

        this.currentInstance = null;

        if (this.instanceStack.length) {
          nextInstance = this.instanceStack.pop();
          this.currentInstance = nextInstance;
        }
        this._trigger('end', currentInstance, nextInstance);
        if (onEnd) {
          onEnd(currentInstance, nextInstance);
        }
      }
    }
  }

  public on(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`Callback must be a function`);
    }
    let callbacks = this._eventCallbacks[eventName];
    if (callbacks) {
      callbacks.push(callback);
    } else {
      throw new TypeError(`Cannot on() event ${eventName} because it does not exist`);
    }
  }

  public off(eventName, callback) {
    if (eventName) {
      let callbacks = this._eventCallbacks[eventName];
      let callbackFound = false;
      if (!callbacks) {
        return;
      }
      if (callback) {
        for (let i = 0; i < callbacks.length; i++) {
          if (callbacks[i] === callback) {
            callbackFound = true;
            callbacks.splice(i, 1);
            i--;
          }
        }
      }
      if (!callbackFound) {
        throw new TypeError(`Cannot off() callback that does not exist`);
      }
    } else {
      throw new TypeError(`Cannot off() event ${eventName} because it does not exist`);
    }
  }

  public run(method: Function);
  public run(target: Function | any | null, method?: Function | string, ...args);
  public run(target: any | null | undefined, method?: any, ...args: any[]) {
    let length = arguments.length;
    let _method: Function | string;
    let _target: any | null | undefined;

    if (length === 1) {
      _method = target;
      _target = null;
    } else {
      _target = target;
      _method = method;
    }

    if (isString(_method)) {
      _method = <Function> _target[_method];
    }

    let onError = getOnError(this.options);

    this.begin();

    // guard against Safari 6's double-finally bug
    let didFinally = false;

    if (onError) {
      try {
        return _method.apply(_target, args);
      } catch (error) {
        onError(error);
      } finally {
        if (!didFinally) {
          didFinally = true;
          this.end();
        }
      }
    } else {
      try {
        return _method.apply(_target, args);
      } finally {
        if (!didFinally) {
          didFinally = true;
          this.end();
        }
      }
    }
  }

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
  public join(...args);
  public join() {
    if (!this.currentInstance) {
      return this.run.apply(this, arguments);
    }

    let length = arguments.length;
    let method;
    let target;

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
      let args = new Array(length - 2);
      for (let i = 0, l = length - 2; i < l; i++) {
        args[i] = arguments[i + 2];
      }
      return method.apply(target, args);
    }
  }

  /*
    Defer the passed function to run inside the specified queue.

    @method defer
    @param {String} queueName
    @param {Object} target
    @param {Function|String} method The method or method name to be executed
    @param {any} args The method arguments
    @return method result
  */
  public defer(queueName: string, ...args);
  public defer(queueName /* , target, method, args */) {
    let length = arguments.length;
    let method;
    let target;
    let args;

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

    let stack = this.DEBUG ? new Error() : undefined;

    if (length > 3) {
      args = new Array(length - 3);
      for (let i = 3; i < length; i++) {
        args[i - 3] = arguments[i];
      }
    } else {
      args = undefined;
    }
    return this._ensureInstance().schedule(queueName, target, method, args, false, stack);
  }

  public deferOnce(queueName: string, ...args);
  public deferOnce(queueName: string /* , target, method, args */) {
    let length = arguments.length;
    let method;
    let target;
    let args;

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

    let stack = this.DEBUG ? new Error() : undefined;

    if (length > 3) {
      args = new Array(length - 3);
      for (let i = 3; i < length; i++) {
        args[i - 3] = arguments[i];
      }
    } else {
      args = undefined;
    }

    let currentInstance = this._ensureInstance();
    return currentInstance.schedule(queueName, target, method, args, true, stack);
  }

  public setTimeout(...args);
  public setTimeout() {
    let l = arguments.length;
    let args = new Array(l);

    for (let x = 0; x < l; x++) {
      args[x] = arguments[x];
    }

    let length = args.length;
    let method;
    let wait;
    let target;
    let methodOrTarget;
    let methodOrWait;
    let methodOrArgs;

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
      let last = args[args.length - 1];

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

    let executeAt = now() + parseInt(wait !== wait ? 0 : wait, 10);

    if (isString(method)) {
      method = target[method];
    }

    let onError = getOnError(this.options);

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
  }

  public throttle(...args);
  public throttle(target, method /* , args, wait, [immediate] */) {
    let backburner = this;
    let args = new Array(arguments.length);
    for (let i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }
    let immediate = args.pop();
    let wait;
    let throttler;
    let index;
    let timer;

    if (isNumber(immediate) || isString(immediate)) {
      wait = immediate;
      immediate = true;
    } else {
      wait = args.pop();
    }

    wait = parseInt(wait, 10);

    index = findThrottler(target, method, this._throttlers);
    if (index > -1) { return this._throttlers[index]; } // throttled

    timer = this._platform.setTimeout(function() {
      if (!immediate) {
        backburner.run.apply(backburner, args);
      }
      index = findThrottler(target, method, backburner._throttlers);
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
  }

  public debounce(...args);
  public debounce(target, method /* , args, wait, [immediate] */) {
    let backburner = this;
    let args = new Array(arguments.length);
    for (let i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    let immediate = args.pop();
    let wait;
    let index;
    let debouncee;
    let timer;

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
      this._platform.clearTimeout(debouncee[2]);
    }

    timer = this._platform.setTimeout(function() {
      if (!immediate) {
        backburner.run.apply(backburner, args);
      }
      index = findDebouncee(target, method, backburner._debouncees);
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
  }

  public cancelTimers() {
    each(this._throttlers, this._boundClearItems);
    this._throttlers = [];

    each(this._debouncees, this._boundClearItems);
    this._debouncees = [];

    this._clearTimerTimeout();
    this._timers = [];

    if (this._autorun) {
      this._platform.clearNext(this._autorun);
      this._autorun = null;
    }
  }

  public hasTimers() {
    return !!this._timers.length || !!this._debouncees.length || !!this._throttlers.length || this._autorun;
  }

  public cancel(timer?) {
    let timerType = typeof timer;

    if (timer && timerType === 'object' && timer.queue && timer.method) { // we're cancelling a deferOnce
      return timer.queue.cancel(timer);
    } else if (timerType === 'function') { // we're cancelling a setTimeout
      for (let i = 0, l = this._timers.length; i < l; i += 2) {
        if (this._timers[i + 1] === timer) {
          this._timers.splice(i, 2); // remove the two elements
          if (i === 0) {
            this._reinstallTimerTimeout();
          }
          return true;
        }
      }
    } else if (Object.prototype.toString.call(timer) === '[object Array]') { // we're cancelling a throttle or debounce
      return this._cancelItem(findThrottler, this._throttlers, timer) ||
               this._cancelItem(findDebouncee, this._debouncees, timer);
    } else {
      return; // timer was null or not a timer
    }
  }

  private _setTimeout(fn, executeAt) {
    if (this._timers.length === 0) {
      this._timers.push(executeAt, fn);
      this._installTimerTimeout();
      return fn;
    }

    // find position to insert
    let i = searchTimer(executeAt, this._timers);

    this._timers.splice(i, 0, executeAt, fn);

    // we should be the new earliest timer if i == 0
    if (i === 0) {
      this._reinstallTimerTimeout();
    }

    return fn;
  }

  private _cancelItem(findMethod, array, timer) {
    let item;
    let index;

    if (timer.length < 3) { return false; }

    index = findMethod(timer[0], timer[1], array);

    if (index > -1) {

      item = array[index];

      if (item[2] === timer[2]) {
        array.splice(index, 1);
        this._platform.clearTimeout(timer[2]);
        return true;
      }
    }

    return false;
  }

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
  private _trigger(eventName, arg1, arg2) {
    let callbacks = this._eventCallbacks[eventName];
    if (callbacks) {
      for (let i = 0; i < callbacks.length; i++) {
        callbacks[i](arg1, arg2);
      }
    }
  }

  private _runExpiredTimers() {
    this._timerTimeoutId = undefined;
    this.run(this, this._scheduleExpiredTimers);
  }

  private _scheduleExpiredTimers() {
    let n = now();
    let timers = this._timers;
    let i = 0;
    let l = timers.length;
    for (; i < l; i += 2) {
      let executeAt = timers[i];
      let fn = timers[i + 1];
      if (executeAt <= n) {
        this.defer(this.options.defaultQueue, null, fn);
      } else {
        break;
      }
    }
    timers.splice(0, i);
    this._installTimerTimeout();
  }

  private _reinstallTimerTimeout() {
    this._clearTimerTimeout();
    this._installTimerTimeout();
  }

  private _clearTimerTimeout() {
    if (!this._timerTimeoutId) {
      return;
    }
    this._platform.clearTimeout(this._timerTimeoutId);
    this._timerTimeoutId = undefined;
  }

  private _installTimerTimeout() {
    if (!this._timers.length) {
      return;
    }
    let minExpiresAt = this._timers[0];
    let n = now();
    let wait = Math.max(0, minExpiresAt - n);
    this._timerTimeoutId = this._platform.setTimeout(this._boundRunExpiredTimers, wait);
  }

  private _ensureInstance(): DeferredActionQueues {
    let currentInstance = this.currentInstance;
    if (!currentInstance) {
      const next = this._platform.next || this._platform.setTimeout // TODO: remove the fallback;
      currentInstance = this.begin();
      this._autorun = next(this._boundAutorunEnd);
    }
    return currentInstance;
  }
}

Backburner.prototype.schedule = Backburner.prototype.defer;
Backburner.prototype.scheduleOnce = Backburner.prototype.deferOnce;
Backburner.prototype.later = Backburner.prototype.setTimeout;
