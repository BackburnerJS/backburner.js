var NUMBER = /\d+/;

function each(collection, callback) {
  for (var i = 0; i < collection.length; i++) {
    callback(collection[i]);
  }
}

// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function() { return new Date().getTime(); };

function isString(suspect) {
  return typeof suspect === 'string';
}

function isFunction(suspect) {
  return typeof suspect === 'function';
}

function isNumber(suspect) {
  return typeof suspect === 'number';
}

function isCoercableNumber(number) {
  return isNumber(number) || NUMBER.test(number);
}

function wrapInTryCatch(func) {
  return function () {
    try {
      return func.apply(this, arguments);
    } catch (e) {
      throw e;
    }
  };
}

export {
  each,
  now,
  isString,
  isFunction,
  isNumber,
  isCoercableNumber,
  wrapInTryCatch
};
