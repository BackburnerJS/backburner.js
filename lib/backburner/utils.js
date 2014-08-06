var NUMBER = /\d+/;

export function each(collection, callback) {
  for (var i = 0; i < collection.length; i++) {
    callback(collection[i]);
  }
}

export function isString(suspect) {
  return typeof suspect === 'string';
}

export function isFunction(suspect) {
  return typeof suspect === 'function';
}

export function isNumber(suspect) {
  return typeof suspect === 'number';
}

export function isCoercableNumber(number) {
  return isNumber(number) || NUMBER.test(number);
}

export function wrapInTryCatch(func) {
  return function () {
    try {
      return func.apply(this, arguments);
    } catch (e) {
      throw e;
    }
  };
}


