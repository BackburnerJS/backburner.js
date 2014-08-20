import Backburner from './backburner';

/* global define:true module:true window: true */
if (typeof define === 'function' && define.amd) {
  define(function() { return Backburner; });
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = Backburner;
} else if (typeof this !== 'undefined') {
  this['Backburner'] = Backburner;
}
