/* global self, global, window */
function ifDefined(o) {
  return typeof o !== 'undefined' ? o : false;
}

var platform = ifDefined(self) || ifDefined(global) || ifDefined(window);

if (!platform) {
  throw new Error('no global: `self` nor `global` nor `window` was found');
}

export default platform;
