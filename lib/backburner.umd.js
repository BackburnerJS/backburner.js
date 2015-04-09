import Backburner from './backburner';
import platform from './backburner/platform';

/* global define:true module:true window: true */
if (typeof define === 'function' && define.amd) {
  define(function() { return Backburner; });
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = Backburner;
} else if (typeof platform !== 'undefined') {
  platform['Backburner'] = Backburner;
}
