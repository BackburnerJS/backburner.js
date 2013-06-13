import Backburner from "backburner";

var originalDateValueOf = Date.prototype.valueOf;

module("setTimeout",{
  teardown: function(){
    Date.prototype.valueOf = originalDateValueOf;
  }
});

test("setTimeout", function() {
  expect(6);

  var bb = new Backburner(['one']),
      step = 0,
      instance;

  // Force +new Date to return the same result while scheduling
  // run.later timers. Otherwise: non-determinism!
  var now = +new Date();
  Date.prototype.valueOf = function() { return now; };

  stop();
  bb.setTimeout(null, function() {
    start();
    instance = bb.currentInstance;
    equal(step++, 0);
  }, 10);

  bb.setTimeout(null, function() {
    equal(step++, 1);
    equal(instance, bb.currentInstance, "same instance");
  }, 10);

  Date.prototype.valueOf = originalDateValueOf;

  stop();
  setTimeout(function() {
    start();
    equal(step++, 2);

    stop();
    bb.setTimeout(null, function() {
      start();
      equal(step++, 3);
      ok(true, "Another later will execute correctly");
    }, 1);
  }, 20);
});

