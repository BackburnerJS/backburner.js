export {
  buildPlatform,
  IPlatform
} from './backburner/platform';

import {
  buildNext,
  buildPlatform,
  IPlatform,
} from './backburner/platform';
import {
  findTimerItem,
  getOnError,
  getQueueItems,
  isCoercableNumber,
  TIMERS_OFFSET
} from './backburner/utils';

import searchTimer from './backburner/binary-search';

import DeferredActionQueues from './backburner/deferred-action-queues';
export type { DeferredActionQueues };

import iteratorDrain, { Iterable } from './backburner/iterator-drain';


import Queue, { QUEUE_STATE } from './backburner/queue';

export type Timer = string | number;

const noop = function() {};

const DISABLE_SCHEDULE = Object.freeze([]);

interface ConsoleWithCreateTask extends Console {
  createTask(name: string): ConsoleTask;
}

interface ConsoleTask {
  run<T>(f: () => T): T;
}

function parseArgs(...args: any[]);
function parseArgs() {
  let length = arguments.length;

  let args;
  let method;
  let target;

  if (length === 0) {
  } else if (length === 1) {
    target = null;
    method = arguments[0];
  } else {
    let argsIndex = 2;
    let methodOrTarget = arguments[0];
    let methodOrArgs = arguments[1];
    let type = typeof methodOrArgs;
    if (type === 'function') {
      target = methodOrTarget;
      method = methodOrArgs;
    } else if (methodOrTarget !== null && type === 'string' && methodOrArgs in methodOrTarget) {
      target = methodOrTarget;
      method = target[methodOrArgs];
    } else if (typeof methodOrTarget === 'function') {
      argsIndex = 1;
      target = null;
      method = methodOrTarget;
    }

    if (length > argsIndex) {
      let len = length - argsIndex;
      args = new Array(len);
      for (let i = 0; i < len; i++) {
        args[i] = arguments[i + argsIndex];
      }
    }
  }

  return [target, method, args];
}

function parseTimerArgs(...args: any[]);
function parseTimerArgs() {
  let [target, method, args] = parseArgs(...arguments);
  let wait = 0;
  let length = args !== undefined ? args.length : 0;

  if (length > 0) {
    let last = args[length - 1];
    if (isCoercableNumber(last)) {
      wait = parseInt(args.pop(), 10);
    }
  }

  return [target, method, args, wait];
}

function parseDebounceArgs(...args: any[]);
function parseDebounceArgs() {
  let target;
  let method;
  let isImmediate;
  let args;
  let wait;

  if (arguments.length === 2) {
    method = arguments[0];
    wait = arguments[1];
    target = null;
  } else {
    [target, method, args] = parseArgs(...arguments);

    if (args === undefined) {
      wait = 0;
    } else {
      wait = args.pop();

      if (!isCoercableNumber(wait)) {
        isImmediate = wait === true;
        wait = args.pop();
      }
    }
  }

  wait = parseInt(wait, 10);

  return [target, method, args, wait, isImmediate];
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

export interface IBackburnerOptions {
  defaultQueue?: string;
  onBegin?: (currentInstance: DeferredActionQueues, previousInstance: DeferredActionQueues) => void;
  onEnd?: (currentInstance: DeferredActionQueues, nextInstance: DeferredActionQueues) => void;
  onError?: (error: any, errorRecordedForStack?: any) => void;
  onErrorTarget?: any;
  onErrorMethod?: string;
  mustYield?: () => boolean;
  _buildPlatform?: (flush: () => void) => IPlatform;
  flush?(queueName: string, flush: () => void): void;
}

export default class Backburner {
  public static Queue = Queue;
  public static buildPlatform = buildPlatform;
  public static buildNext = buildNext;

  public DEBUG = false;
  public ASYNC_STACKS = false;

  public currentInstance: DeferredActionQueues | null = null;

  public options: IBackburnerOptions;

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
  private _eventCallbacks: {
    end: Function[];
    begin: Function[];
  } = {
    end: [],
    begin: []
  };

  private _timerTimeoutId: number | null = null;
  private _timers: any[] = [];
  private _platform: IPlatform;

  private _boundRunExpiredTimers: () => void;

  private _autorun = false;
  private _autorunStack: Error | undefined | null = null;
  private _boundAutorunEnd: () => void;
  private _defaultQueue: string;

  constructor(queueNames: string[], options?: IBackburnerOptions) {
    this.queueNames = queueNames;
    this.options = options || {};
    if (typeof this.options.defaultQueue === 'string') {
      this._defaultQueue = this.options.defaultQueue;
    } else {
      this._defaultQueue = this.queueNames[0];
    }

    this._onBegin = this.options.onBegin || noop;
    this._onEnd = this.options.onEnd || noop;

    this._boundRunExpiredTimers = this._runExpiredTimers.bind(this);

    this._boundAutorunEnd = () => {
      autorunsCompletedCount++;

      // if the autorun was already flushed, do nothing
      if (this._autorun === false) { return; }

      this._autorun = false;
      this._autorunStack = null;
      this._end(true /* fromAutorun */);
    };

    let builder = this.options._buildPlatform || buildPlatform;
    this._platform = builder(this._boundAutorunEnd);
  }

  public get defaultQueue() {
    return this._defaultQueue;
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

    if (this._autorun !== false) {
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
    this._end(false);
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
  public defer(queueName, target, method, ...args) {
    deferCount++;
    return this.schedule(queueName, target, method, ...args);
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
    let consoleTask = this.createTask(queueName, method);
    return this._ensureInstance().schedule(queueName, target, method, args, false, stack, consoleTask);
  }

  /*
    Defer the passed iterable of functions to run inside the specified queue.

    @method scheduleIterable
    @param {String} queueName
    @param {Iterable} an iterable of functions to execute
    @return method result
  */
  public scheduleIterable(queueName: string, iterable: () => Iterable) {
    scheduleIterableCount++;
    let stack = this.DEBUG ? new Error() : undefined;
    let consoleTask = this.createTask(queueName, null);
    return this._ensureInstance().schedule(queueName, null, iteratorDrain, [iterable], false, stack, consoleTask);
  }

  /**
   * @deprecated please use scheduleOnce instead.
   */
  public deferOnce(queueName, target, method, ...args) {
    deferOnceCount++;
    return this.scheduleOnce(queueName, target, method, ...args);
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
    let consoleTask = this.createTask(queueName, method);
    return this._ensureInstance().schedule(queueName, target, method, args, true, stack, consoleTask);
  }

  /**
   * @deprecated use later instead.
   */
  public setTimeout(...args);
  public setTimeout() {
    setTimeoutCount++;
    return this.later(...arguments);
  }

  public later<T>(...args: any[]): Timer; // fixes `this.later(...arguments)` usage in `setTimeout`
  public later<T>(target: T, methodName: keyof T, wait?: number | string): Timer;
  public later<T>(target: T, methodName: keyof T, arg1: any, wait?: number | string): Timer;
  public later<T>(target: T, methodName: keyof T, arg1: any, arg2: any, wait?: number | string): Timer;
  public later<T>(target: T, methodName: keyof T, arg1: any, arg2: any, arg3: any, wait?: number | string): Timer;

  // with target, with optional immediate
  public later(thisArg: any | null, method: () => void, wait?: number | string): Timer;
  public later<A>(thisArg: any | null, method: (arg1: A) => void, arg1: A, wait?: number | string): Timer;
  public later<A, B>(thisArg: any | null, method: (arg1: A, arg2: B) => void, arg1: A, arg2: B, wait?: number | string): Timer;
  public later<A, B, C>(thisArg: any | null, method: (arg1: A, arg2: B, arg3: C) => void, arg1: A, arg2: B, arg3: C, wait?: number | string): Timer;

  // without target, with optional immediate
  public later(method: () => void, wait?: number | string): Timer;
  public later<A>(method: (arg1: A) => void, arg1: A, wait?: number | string): Timer;
  public later<A, B>(method: (arg1: A, arg2: B) => void, arg1: A, arg2: B, wait?: number | string): Timer;
  public later<A, B, C>(method: (arg1: A, arg2: B, arg3: C) => void, arg1: A, arg2: B, arg3: C, wait?: number | string): Timer;
  public later() {
    laterCount++;
    let [target, method, args, wait] = parseTimerArgs(...arguments);
    return this._later(target, method, args, wait);
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
  public throttle(): Timer {
    throttleCount++;
    let [target, method, args, wait, isImmediate = true] = parseDebounceArgs(...arguments);

    let index = findTimerItem(target, method, this._timers);
    let timerId;
    if (index === -1) {
      timerId = this._later(target, method, isImmediate ? DISABLE_SCHEDULE : args, wait);

      if (isImmediate) {
        this._join(target, method, args);
      }
    } else {
      timerId = this._timers[index + 1];
      let argIndex = index + 4;
      if (this._timers[argIndex] !== DISABLE_SCHEDULE) {
        this._timers[argIndex] = args;
      }
    }

    return timerId;
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
  public debounce(): Timer {
    debounceCount++;
    let [target, method, args, wait, isImmediate = false] = parseDebounceArgs(...arguments);
    let _timers = this._timers;
    let index = findTimerItem(target, method, _timers);

    let timerId;
    if (index === -1) {
      timerId = this._later(target, method, isImmediate ? DISABLE_SCHEDULE : args, wait);
      if (isImmediate) {
        this._join(target, method, args);
      }
    } else {
      let executeAt = this._platform.now() + wait;

      let argIndex = index + 4;
      if (_timers[argIndex] === DISABLE_SCHEDULE) {
        args = DISABLE_SCHEDULE;
      }

      timerId = _timers[index + 1];
      let i = searchTimer(executeAt, _timers);

      if ((index + TIMERS_OFFSET) === i) {
        _timers[index] = executeAt;
        _timers[argIndex] = args;
      } else {
        let stack = this._timers[index + 5];
        let consoleTask = this._timers[index + 6];
        this._timers.splice(i, 0, executeAt, timerId, target, method, args, stack, consoleTask);
        this._timers.splice(index, TIMERS_OFFSET);
      }

      if (index === 0) {
        this._reinstallTimerTimeout();
      }
    }

    return timerId;
  }

  public cancelTimers() {
    cancelTimersCount++;
    this._clearTimerTimeout();
    this._timers = [];
    this._cancelAutorun();
  }

  public hasTimers() {
    return this._timers.length > 0 || this._autorun;
  }

  public cancel(timer?) {
    cancelCount++;
    if (timer === null || timer === undefined) { return false; }
    let timerType = typeof timer;

    if (timerType === 'number') { // we're cancelling a setTimeout or throttle or debounce
      return this._cancelLaterTimer(timer);
    } else if (timerType === 'object' && timer.queue && timer.method) { // we're cancelling a deferOnce
      return timer.queue.cancel(timer);
    }

    return false;
  }

  public ensureInstance() {
    this._ensureInstance();
  }

  /**
   * Returns debug information related to the current instance of Backburner
   *
   * @method getDebugInfo
   * @returns {Object | undefined} Will return and Object containing debug information if
   * the DEBUG flag is set to true on the current instance of Backburner, else undefined.
   */
  public getDebugInfo() {
    if (this.DEBUG) {
      return {
        autorun: this._autorunStack,
        counters: this.counters,
        timers: getQueueItems(this._timers, TIMERS_OFFSET, 2),
        instanceStack: [this.currentInstance, ...this.instanceStack]
          .map((deferredActionQueue) => deferredActionQueue && deferredActionQueue._getDebugInfo(this.DEBUG))
      };
    }

    return undefined;
  }

  private _end(fromAutorun: boolean) {
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
      result = currentInstance.flush(fromAutorun);
    } finally {
      if (!finallyAlreadyCalled) {
        finallyAlreadyCalled = true;

        if (result === QUEUE_STATE.Pause) {
          const plannedNextQueue = this.queueNames[currentInstance.queueNameIndex];
          this._scheduleAutorun(plannedNextQueue);
        } else {
          this.currentInstance = null;

          if (this.instanceStack.length > 0) {
            nextInstance = this.instanceStack.pop() as DeferredActionQueues;
            this.currentInstance = nextInstance;
          }
          this._trigger('end', currentInstance, nextInstance);
          this._onEnd(currentInstance, nextInstance);
        }
      }
    }
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
    if (this._autorun) {
      this._platform.clearNext();
      this._autorun = false;
      this._autorunStack = null;
    }
  }

  private _later(target, method, args, wait) {
    let stack = this.DEBUG ? new Error() : undefined;
    let consoleTask = this.createTask('(timer)', method);
    let executeAt = this._platform.now() + wait;
    let id = UUID++;

    if (this._timers.length === 0) {
      this._timers.push(executeAt, id, target, method, args, stack, consoleTask);
      this._installTimerTimeout();
    } else {
      // find position to insert
      let i = searchTimer(executeAt, this._timers);
      this._timers.splice(i, 0, executeAt, id, target, method, args, stack, consoleTask);

      // always reinstall since it could be out of sync
      this._reinstallTimerTimeout();
    }
    return id;
  }

  private _cancelLaterTimer(timer) {
    for (let i = 1; i < this._timers.length; i += TIMERS_OFFSET) {
      if (this._timers[i] === timer) {
        this._timers.splice(i - 1, TIMERS_OFFSET);
        if (i === 1) {
          this._reinstallTimerTimeout();
        }
        return true;
      }
    }
    return false;
  }

  /**
   Trigger an event. Supports up to two arguments. Designed around
   triggering transition events from one run loop instance to the
   next, which requires an argument for the  instance and then
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
    if (this._timers.length > 0) {
      this.begin();
      this._scheduleExpiredTimers();
      this.end();
    }
  }

  private _scheduleExpiredTimers() {
    let timers = this._timers;
    let i = 0;
    let l = timers.length;
    let defaultQueue = this._defaultQueue;
    let n = this._platform.now();

    for (; i < l; i += TIMERS_OFFSET) {
      let executeAt = timers[i];
      if (executeAt > n) { break; }
      let args = timers[i + 4];
      if (args !== DISABLE_SCHEDULE) {
        let target = timers[i + 2];
        let method = timers[i + 3];
        let stack = timers[i + 5];
        let consoleTask = timers[i + 6];
        this.currentInstance!.schedule(defaultQueue, target, method, args, false, stack, consoleTask);
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
      this._autorunStack = this.DEBUG ? new Error() : undefined;
      currentInstance = this.begin();
      this._scheduleAutorun(this.queueNames[0]);
    }
    return currentInstance;
  }

  private _scheduleAutorun(plannedNextQueue: string) {
    autorunsCreatedCount++;

    const next = this._platform.next;
    const flush = this.options.flush;

    if (flush) {
      flush(plannedNextQueue, next);
    } else {
      next();
    }

    this._autorun = true;
  }

  private createTask(queueName, method){
    if (this.ASYNC_STACKS && console['createTask']) {
      return (console as ConsoleWithCreateTask).createTask(
        `runloop ${queueName} | ${method?.name || '<anonymous>'}`
      );
    }
  }
}
