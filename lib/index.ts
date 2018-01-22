import {
  findItem,
  findTimer,
  getOnError,
  isCoercableNumber
} from './backburner/utils';

import searchTimer from './backburner/binary-search';
import DeferredActionQueues from './backburner/deferred-action-queues';
import iteratorDrain, { Iteratable } from './backburner/iterator-drain';

import Queue, { QUEUE_STATE } from './backburner/queue';

type Timer = any;

const noop = function() {};
const SET_TIMEOUT = setTimeout;

function parseArgs() {
  let length = arguments.length;
  let method;
  let target;
  let args;

  if (length === 1) {
    method = arguments[0];
    target = null;
  } else {
    target = arguments[0];
    method = arguments[1];
    if (typeof method === 'string') {
      method = target[method];
    }

    if (length > 2) {
      args = new Array(length - 2);
      for (let i = 0, l = length - 2; i < l; i++) {
        args[i] = arguments[i + 2];
      }
    }
  }

  return [target, method, args];
}

let UUID = 0;

let beginCount = 0;
let endCount = 0;
let beginEventCount = 0;
let endEventCount = 0;
let runCount = 0;
let joinCount = 0;
let deferCount = 0;
let scheduleCount = 0;
let scheduleIterableCount = 0;
let deferOnceCount = 0;
let scheduleOnceCount = 0;
let setTimeoutCount = 0;
let laterCount = 0;
let throttleCount = 0;
let debounceCount = 0;
let cancelTimersCount = 0;
let cancelCount = 0;
let autorunsCreatedCount = 0;
let autorunsCompletedCount = 0;
let deferredActionQueuesCreatedCount = 0;
let nestedDeferredActionQueuesCreated = 0;

export default class Backburner {
  public static Queue = Queue;

  public DEBUG = false;

  public currentInstance: DeferredActionQueues | null = null;

  public options: any;

  public get counters() {
    return {
      begin: beginCount,
      end: endCount,
      events: {
        begin: beginEventCount,
        end: endEventCount,
      },
      autoruns: {
        created: autorunsCreatedCount,
        completed: autorunsCompletedCount,
      },
      run: runCount,
      join: joinCount,
      defer: deferCount,
      schedule: scheduleCount,
      scheduleIterable: scheduleIterableCount,
      deferOnce: deferOnceCount,
      scheduleOnce: scheduleOnceCount,
      setTimeout: setTimeoutCount,
      later: laterCount,
      throttle: throttleCount,
      debounce: debounceCount,
      cancelTimers: cancelTimersCount,
      cancel: cancelCount,
      loops: {
        total: deferredActionQueuesCreatedCount,
        nested: nestedDeferredActionQueuesCreated,
      },
    };
  }

  private _onBegin: (currentInstance: DeferredActionQueues, previousInstance: DeferredActionQueues | null) => void;
  private _onEnd: (currentInstance: DeferredActionQueues, nextInstance: DeferredActionQueues | null) => void;
  private queueNames: string[];
  private instanceStack: DeferredActionQueues[] = [];
  private _debouncees: any[] = [];
  private _throttlers: any[] = [];
  private _eventCallbacks: {
    end: Function[];
    begin: Function[];
  } = {
    end: [],
    begin: []
  };

  private _timerTimeoutId: number | null = null;
  private _timers: any[] = [];
  private _platform: {
    setTimeout(fn: Function, ms: number): number;
    clearTimeout(id: number): void;
    next(fn: Function): number;
    clearNext(id: any): void;
    now(): number;
  };

  private _boundRunExpiredTimers: () => void;

  private _autorun: number | null = null;
  private _boundAutorunEnd: () => void;

  constructor(queueNames: string[], options: any = {} ) {
    this.queueNames = queueNames;
    this.options = options;
    if (!this.options.defaultQueue) {
      this.options.defaultQueue = queueNames[0];
    }

    this._onBegin = this.options.onBegin || noop;
    this._onEnd = this.options.onEnd || noop;

    let _platform = this.options._platform || {};
    let platform = Object.create(null);

    platform.setTimeout = _platform.setTimeout || ((fn, ms) => setTimeout(fn, ms));
    platform.clearTimeout = _platform.clearTimeout || ((id) => clearTimeout(id));
    platform.next = _platform.next || ((fn) => SET_TIMEOUT(fn, 0));
    platform.clearNext = _platform.clearNext || platform.clearTimeout;
    platform.now = _platform.now || (() => Date.now());

    this._platform = platform;

    this._boundRunExpiredTimers = () => {
      this._runExpiredTimers();
    };

    this._boundAutorunEnd = () => {
      autorunsCompletedCount++;
      this._autorun = null;
      this.end();
    };
  }

  /*
    @method begin
    @return instantiated class DeferredActionQueues
  */
  public begin(): DeferredActionQueues {
    beginCount++;
    let options = this.options;
    let previousInstance = this.currentInstance;
    let current;

    if (this._autorun !== null) {
      current = previousInstance;
      this._cancelAutorun();
    } else {
      if (previousInstance !== null) {
        nestedDeferredActionQueuesCreated++;
        this.instanceStack.push(previousInstance);
      }
      deferredActionQueuesCreatedCount++;
      current = this.currentInstance = new DeferredActionQueues(this.queueNames, options);
      beginEventCount++;
      this._trigger('begin', current, previousInstance);
    }

    this._onBegin(current, previousInstance);

    return current;
  }

  public end() {
    endCount++;
    let currentInstance = this.currentInstance;
    let nextInstance: DeferredActionQueues | null  = null;

    if (currentInstance === null) {
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

        if (result === QUEUE_STATE.Pause) {
          autorunsCreatedCount++;
          const next = this._platform.next;
          this._autorun = next(this._boundAutorunEnd);
        } else {
          this.currentInstance = null;

          if (this.instanceStack.length > 0) {
            nextInstance = this.instanceStack.pop() as DeferredActionQueues;
            this.currentInstance = nextInstance;
          }
          endEventCount++;
          this._trigger('end', currentInstance, nextInstance);
          this._onEnd(currentInstance, nextInstance);
        }
      }
    }
  }

  public on(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`Callback must be a function`);
    }
    let callbacks = this._eventCallbacks[eventName];
    if (callbacks !== undefined) {
      callbacks.push(callback);
    } else {
      throw new TypeError(`Cannot on() event ${eventName} because it does not exist`);
    }
  }

  public off(eventName, callback) {
    let callbacks = this._eventCallbacks[eventName];
    if (!eventName || callbacks === undefined) {
      throw new TypeError(`Cannot off() event ${eventName} because it does not exist`);
    }
    let callbackFound = false;
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
  }

  public run(target: Function);
  public run(target: Function | any | null, method?: Function | string, ...args);
  public run(target: any | null | undefined, method?: Function, ...args: any[]);
  public run() {
    runCount++;
    let [target, method, args] = parseArgs(...arguments);
    return this._run(target, method, args);
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
  public join(target: Function);
  public join(target: Function | any | null, method?: Function | string, ...args);
  public join(target: any | null | undefined, method?: Function, ...args: any[]);
  public join() {
    joinCount++;
    let [target, method, args] = parseArgs(...arguments);
    return this._join(target, method, args);
  }

  /**
   * @deprecated please use schedule instead.
   */
  public defer(queueName, targetOrMethod, ..._args) {
    deferCount++;
    return this.schedule(queueName, targetOrMethod, ..._args);
  }

  /**
   * Schedule the passed function to run inside the specified queue.
   */
  public schedule(queueName: string, method: Function);
  public schedule<T, U extends keyof T>(queueName: string, target: T, method: U, ...args);
  public schedule(queueName: string, target: any, method: any | Function, ...args);
  public schedule(queueName, ..._args) {
    scheduleCount++;
    let [target, method, args] = parseArgs(..._args);
    let stack = this.DEBUG ? new Error() : undefined;
    return this._ensureInstance().schedule(queueName, target, method, args, false, stack);
  }

  /*
    Defer the passed iterable of functions to run inside the specified queue.

    @method scheduleIterable
    @param {String} queueName
    @param {Iterable} an iterable of functions to execute
    @return method result
  */
  public scheduleIterable(queueName: string, iterable: () => Iteratable) {
    scheduleIterableCount++;
    let stack = this.DEBUG ? new Error() : undefined;
    return this._ensureInstance().schedule(queueName, null, iteratorDrain, [iterable], false, stack);
  }

  /**
   * @deprecated please use scheduleOnce instead.
   */
  public deferOnce(queueName, targetOrMethod, ...args) {
    deferOnceCount++;
    return this.scheduleOnce(queueName, targetOrMethod, ...args);
  }

  /**
   * Schedule the passed function to run once inside the specified queue.
   */
  public scheduleOnce(queueName: string, method: Function);
  public scheduleOnce<T, U extends keyof T>(queueName: string, target: T, method: U, ...args);
  public scheduleOnce(queueName: string, target: any | null, method: any | Function, ...args);
  public scheduleOnce(queueName, ..._args) {
    scheduleOnceCount++;
    let [target, method, args] = parseArgs(..._args);
    let stack = this.DEBUG ? new Error() : undefined;
    return this._ensureInstance().schedule(queueName, target, method, args, true, stack);
  }

  /**
   * @deprecated use later instead.
   */
  public setTimeout(...args);
  public setTimeout() {
    setTimeoutCount++;
    return this.later(...arguments);
  }

  public later(...args) {
    laterCount++;
    let length = args.length;

    let wait = 0;
    let method;
    let target;
    let methodOrTarget;
    let methodOrArgs;

    if (length === 0) {
      return;
    } else if (length === 1) {
      method = args.shift();
    } else {
      let last = args[args.length - 1];

      if (isCoercableNumber(last)) {
        wait = parseInt(args.pop(), 10);
      }

      methodOrTarget = args[0];
      methodOrArgs = args[1];
      let type = typeof methodOrArgs;
      if (type === 'function') {
        target = args.shift();
        method = args.shift();
      } else if (methodOrTarget !== null && type === 'string' && methodOrArgs in methodOrTarget) {
        target = args.shift();
        method = target[args.shift()];
      } else {
        method = args.shift();
      }
    }

    return this._setTimeout(target, method, args, wait);
  }

  public throttle<T>(target: T, methodName: keyof T, wait?: number | string, immediate?: boolean): Timer;
  public throttle<T>(target: T, methodName: keyof T, arg1: any, wait?: number | string, immediate?: boolean): Timer;
  public throttle<T>(target: T, methodName: keyof T, arg1: any, arg2: any, wait?: number | string, immediate?: boolean): Timer;
  public throttle<T>(target: T, methodName: keyof T, arg1: any, arg2: any, arg3: any, wait?: number | string, immediate?: boolean): Timer;

  // with target, with immediate
  public throttle(thisArg: any | null, method: () => void, wait?: number | string, immediate?: boolean): Timer;
  public throttle<A>(thisArg: any | null, method: (arg1: A) => void, arg1: A, wait?: number | string, immediate?: boolean): Timer;
  public throttle<A, B>(thisArg: any | null, method: (arg1: A, arg2: B) => void, arg1: A, arg2: B, wait?: number | string, immediate?: boolean): Timer;
  public throttle<A, B, C>(thisArg: any | null, method: (arg1: A, arg2: B, arg3: C) => void, arg1: A, arg2: B, arg3: C, wait?: number | string, immediate?: boolean): Timer;

  // without target, with immediate
  public throttle(method: () => void, wait?: number | string, immediate?: boolean): Timer;
  public throttle<A>(method: (arg1: A) => void, arg1: A, wait?: number | string, immediate?: boolean): Timer;
  public throttle<A, B>(method: (arg1: A, arg2: B) => void, arg1: A, arg2: B, wait?: number | string, immediate?: boolean): Timer;
  public throttle<A, B, C>(method: (arg1: A, arg2: B, arg3: C) => void, arg1: A, arg2: B, arg3: C, wait?: number | string, immediate?: boolean): Timer;
  public throttle(targetOrThisArgOrMethod: object | Function, ...args): Timer {
    throttleCount++;
    let target;
    let method;
    let immediate;
    let isImmediate;
    let wait;

    if (args.length === 1) {
      method = targetOrThisArgOrMethod;
      wait = args.pop();
      target = null;
      isImmediate = true;
    } else {
      target = targetOrThisArgOrMethod;
      method = args.shift();
      immediate = args.pop();
      let type = typeof method;
      if (type === 'string') {
        method = target[method];
      } else if (type !== 'function') {
        args.unshift(method);
        method = target;
        target = null;
      }

      if (isCoercableNumber(immediate)) {
        wait = immediate;
        isImmediate = true;
      } else {
        wait = args.pop();
        isImmediate = immediate === true;
      }
    }

    let index = findItem(target, method, this._throttlers);
    if (index > -1) {
      this._throttlers[index + 2] = args;
      return this._throttlers[index + 3];
    } // throttled

    wait = parseInt(wait, 10);

    let timer = this._platform.setTimeout(() => {
      let i = findTimer(timer, this._throttlers);
      let [context, func, params] = this._throttlers.splice(i, 4);
      if (isImmediate === false) {
        this._run(context, func, params);
      }
    }, wait);

    if (isImmediate) {
      this._join(target, method, args);
    }

    this._throttlers.push(target, method, args, timer);

    return timer;
  }

  // with target, with method name, with optional immediate
  public debounce<T>(target: T, methodName: keyof T, wait: number | string, immediate?: boolean): Timer;
  public debounce<T>(target: T, methodName: keyof T, arg1: any, wait: number | string, immediate?: boolean): Timer;
  public debounce<T>(target: T, methodName: keyof T, arg1: any, arg2: any, wait: number | string, immediate?: boolean): Timer;
  public debounce<T>(target: T, methodName: keyof T, arg1: any, arg2: any, arg3: any, wait: number | string, immediate?: boolean): Timer;

  // with target, with optional immediate
  public debounce(thisArg: any | null, method: () => void, wait: number | string, immediate?: boolean): Timer;
  public debounce<A>(thisArg: any | null, method: (arg1: A) => void, arg1: A, wait: number | string, immediate?: boolean): Timer;
  public debounce<A, B>(thisArg: any | null, method: (arg1: A, arg2: B) => void, arg1: A, arg2: B, wait: number | string, immediate?: boolean): Timer;
  public debounce<A, B, C>(thisArg: any | null, method: (arg1: A, arg2: B, arg3: C) => void, arg1: A, arg2: B, arg3: C, wait: number | string, immediate?: boolean): Timer;

  // without target, with optional immediate
  public debounce(method: () => void, wait: number | string, immediate?: boolean): Timer;
  public debounce<A>(method: (arg1: A) => void, arg1: A, wait: number | string, immediate?: boolean): Timer;
  public debounce<A, B>(method: (arg1: A, arg2: B) => void, arg1: A, arg2: B, wait: number | string, immediate?: boolean): Timer;
  public debounce<A, B, C>(method: (arg1: A, arg2: B, arg3: C) => void, arg1: A, arg2: B, arg3: C, wait: number | string, immediate?: boolean): Timer;
  public debounce(targetOrThisArgOrMethod: object | Function, ...args): Timer {
    debounceCount++;
    let target;
    let method;
    let immediate;
    let isImmediate;
    let wait;

    if (args.length === 1) {
      method = targetOrThisArgOrMethod;
      wait = args.pop();
      target = null;
      isImmediate = false;
    } else {
      target = targetOrThisArgOrMethod;
      method = args.shift();
      immediate = args.pop();

      let type = typeof method;
      if (type === 'string') {
        method = target[method];
      } else if (type !== 'function') {
        args.unshift(method);
        method = target;
        target = null;
      }

      if (isCoercableNumber(immediate)) {
        wait = immediate;
        isImmediate = false;
      } else {
        wait = args.pop();
        isImmediate = immediate === true;
      }
    }

    wait = parseInt(wait, 10);

    // Remove debouncee
    let index = findItem(target, method, this._debouncees);
    if (index > -1) {
      let timerId = this._debouncees[index + 3];
      this._platform.clearTimeout(timerId);
      this._debouncees.splice(index, 4);
    }

    let timer = this._platform.setTimeout(() => {
      let i = findTimer(timer, this._debouncees);
      let [context, func, params] = this._debouncees.splice(i, 4);
      if (isImmediate === false) {
        this._run(context, func, params);
      }
    }, wait);

    if (isImmediate && index === -1) {
      this._join(target, method, args);
    }

    this._debouncees.push(target, method, args, timer);

    return timer;
  }

  public cancelTimers() {
    cancelTimersCount++;
    for (let i = 3; i < this._throttlers.length; i += 4) {
      this._platform.clearTimeout(this._throttlers[i]);
    }
    this._throttlers = [];

    for (let t = 3; t < this._debouncees.length; t += 4) {
      this._platform.clearTimeout(this._debouncees[t]);
    }
    this._debouncees = [];

    this._clearTimerTimeout();
    this._timers = [];

    this._cancelAutorun();
  }

  public hasTimers() {
    return this._timers.length > 0 ||
       this._debouncees.length > 0 ||
       this._throttlers.length > 0 ||
       this._autorun !== null;
  }

  public cancel(timer?) {
    cancelCount++;
    if (!timer) { return false; }
    let timerType = typeof timer;

    if (timerType === 'number') { // we're cancelling a throttle or debounce
      return this._cancelItem(timer, this._throttlers) || this._cancelItem(timer, this._debouncees);
    } else if (timerType === 'string') { // we're cancelling a setTimeout
      return this._cancelLaterTimer(timer);
    } else if (timerType === 'object' && timer.queue && timer.method) { // we're cancelling a deferOnce
      return timer.queue.cancel(timer);
    }

    return false;
  }

  public ensureInstance() {
    this._ensureInstance();
  }

  private _join(target, method, args) {
    if (this.currentInstance === null) {
      return this._run(target, method, args);
    }

    if (target === undefined && args === undefined) {
      return method();
    } else {
      return method.apply(target, args);
    }
  }

  private _run(target, method, args) {
    let onError = getOnError(this.options);

    this.begin();

    if (onError) {
      try {
        return method.apply(target, args);
      } catch (error) {
        onError(error);
      } finally {
        this.end();
      }
    } else {
      try {
        return method.apply(target, args);
      } finally {
        this.end();
      }
    }
  }

  private _cancelAutorun() {
    if (this._autorun !== null) {
      this._platform.clearNext(this._autorun);
      this._autorun = null;
    }
  }

  private _setTimeout(target, method, args, wait) {
    let stack = this.DEBUG ? new Error() : undefined;
    let executeAt = this._platform.now() + wait;
    let id = (UUID++) + '';

    if (this._timers.length === 0) {
      this._timers.push(executeAt, id, target, method, args, stack);
      this._installTimerTimeout();
      return id;
    }

    // find position to insert
    let i = searchTimer(executeAt, this._timers);
    this._timers.splice(i, 0, executeAt, id, target, method, args, stack);

    // we should be the new earliest timer if i == 0
    if (i === 0) {
      this._reinstallTimerTimeout();
    }

    return id;
  }

  private _cancelLaterTimer(timer) {
    for (let i = 1; i < this._timers.length; i += 6) {
      if (this._timers[i] === timer) {
        i = i - 1;
        this._timers.splice(i, 6);
        if (i === 0) {
          this._reinstallTimerTimeout();
        }
        return true;
      }
    }
    return false;
  }

  private _cancelItem(timer, array) {
    let index = findTimer(timer, array);

    if (index > -1) {
      this._platform.clearTimeout(timer);
      array.splice(index, 4);
      return true;
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
  private _trigger<T, U>(eventName: string, arg1: T, arg2: U) {
    let callbacks = this._eventCallbacks[eventName];
    if (callbacks !== undefined) {
      for (let i = 0; i < callbacks.length; i++) {
        callbacks[i](arg1, arg2);
      }
    }
  }

  private _runExpiredTimers() {
    this._timerTimeoutId = null;
    if (this._timers.length === 0) { return; }
    this.begin();
    this._scheduleExpiredTimers();
    this.end();
  }

  private _scheduleExpiredTimers() {
    let timers = this._timers;
    let i = 0;
    let l = timers.length;
    let defaultQueue = this.options.defaultQueue;
    let n = this._platform.now();

    for (; i < l; i += 6) {
      let executeAt = timers[i];
      if (executeAt <= n) {
        let target = timers[i + 2];
        let method = timers[i + 3];
        let args = timers[i + 4];
        let stack = timers[i + 5];
        this.currentInstance!.schedule(defaultQueue, target, method, args, false, stack);
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
    if (this._timerTimeoutId === null) { return; }
    this._platform.clearTimeout(this._timerTimeoutId);
    this._timerTimeoutId = null;
  }

  private _installTimerTimeout() {
    if (this._timers.length === 0) { return; }
    let minExpiresAt = this._timers[0];
    let n = this._platform.now();
    let wait = Math.max(0, minExpiresAt - n);
    this._timerTimeoutId = this._platform.setTimeout(this._boundRunExpiredTimers, wait);
  }

  private _ensureInstance(): DeferredActionQueues {
    let currentInstance = this.currentInstance;
    if (currentInstance === null) {
      autorunsCreatedCount++;
      currentInstance = this.begin();
      const next = this._platform.next;
      this._autorun = next(this._boundAutorunEnd);
    }
    return currentInstance;
  }
}
