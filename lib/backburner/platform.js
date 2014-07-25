// In IE 6-8, try/finally doesn't work without a catch.
// Unfortunately, this is impossible to test for since wrapping it in a parent try/catch doesn't trigger the bug.
// This tests for another broken try/catch behavior that only exhibits in the same versions of IE.
export var needsIETryCatchFix = (function(e,x){
  try{ x(); }
  catch(e) { } // jshint ignore:line
  return !!e;
})();
