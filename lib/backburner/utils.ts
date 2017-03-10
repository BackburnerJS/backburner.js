var NUMBER = /\d+/;

export var now = Date.now;

export function each<T>(collection: T[], callback: (v: T) => void) {
  for (var i = 0; i < collection.length; i++) {
    callback(collection[i]);
  }
}

export function isString(suspect: any): suspect is string {
  return typeof suspect === 'string';
}

export function isFunction(suspect: any): suspect is Function {
  return typeof suspect === 'function';
}

export function isNumber(suspect: any): suspect is number {
  return typeof suspect === 'number';
}

export function isCoercableNumber(suspect) {
  return isNumber(suspect) || NUMBER.test(suspect);
}

export function noSuchQueue(name) {
  throw new Error('You attempted to schedule an action in a queue (' + name + ') that doesn\'t exist');
}

export function noSuchMethod(name) {
  throw new Error('You attempted to schedule an action in a queue (' + name + ') for a method that doesn\'t exist');
}

export function getOnError(options) {
  return options.onError || (options.onErrorTarget && options.onErrorTarget[options.onErrorMethod]);
}

export function findDebouncee(target, method, debouncees) {
  return findItem(target, method, debouncees);
}

export function findThrottler(target, method, throttlers) {
  return findItem(target, method, throttlers);
}

export function findItem(target, method, collection) {
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
