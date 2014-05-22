export default {
  each: function(collection, callback) {
    for (var i = 0; i < collection.length; i++) {
      callback(collection[i]);
    }
  },

  isString: function(suspect) {
    return typeof suspect === 'string';
  },

  isFunction: function(suspect) {
    return typeof suspect === 'function';
  },

  isNumber: function(suspect) {
    return typeof suspect === 'number';
  }
};
