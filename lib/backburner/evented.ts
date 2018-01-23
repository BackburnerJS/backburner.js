
export default class Evented {

  private _eventCallbacks: {
    end: Function[];
    begin: Function[];
  } = {
    end: [],
    begin: []
  };

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

  /**
   Trigger an event. Supports up to two arguments. Designed around
   triggering transition events from one run loop instance to the
   next, which requires an argument for the first instance and then
   an argument for the next instance.

   @protected
   @method _trigger
   @param {String} eventName
   @param {any} arg1
   @param {any} arg2
   */
  protected _trigger<T, U>(eventName: string, arg1: T, arg2: U) {
    let callbacks = this._eventCallbacks[eventName];
    if (callbacks !== undefined) {
      for (let i = 0; i < callbacks.length; i++) {
        callbacks[i](arg1, arg2);
      }
    }
  }

}
