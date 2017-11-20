const NUMBER = /\d+/;

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
  return isNumber(suspect) && suspect === suspect || NUMBER.test(suspect);
}

export function noSuchQueue(name) {
  throw new Error(`You attempted to schedule an action in a queue (${name}) that doesn\'t exist`);
}

export function noSuchMethod(name) {
  throw new Error(`You attempted to schedule an action in a queue (${name}) for a method that doesn\'t exist`);
}

export function getOnError(options) {
  return options.onError || (options.onErrorTarget && options.onErrorTarget[options.onErrorMethod]);
}

export function findItem(target, method, collection) {
  let index = -1;

  for (let i = 0, l = collection.length; i < l; i += 3) {
    if (collection[i] === target && collection[i + 1] === method) {
      index = i;
      break;
    }
  }

  return index;
}

export function findTimer(timer, collection) {
  let index = -1;

  for (let i = 3; i < collection.length; i += 4) {
    if (collection[i] === timer) {
      index = i - 3;
      break;
    }
  }

  return index;
}
