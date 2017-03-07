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
