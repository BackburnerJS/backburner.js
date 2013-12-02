import { Backburner } from "backburner";

module("cancel");

test("null", function() {
  // mimic browser behavior: window.clearTimeout(null) -> undefined
  expect(3);
  var bb = new Backburner(['cancel']);
  equal(bb.cancel(), undefined, "cancel with no arguments should return undefined");
  equal(bb.cancel(null), undefined, "cancel a null timer should return undefined");
  equal(bb.cancel(undefined), undefined, "cancel an undefined timer should return undefined");
});

test("deferOnce", function() {
  expect(3);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    var timer = bb.deferOnce('one', function() {
      functionWasCalled = true;
    });

    ok(timer, "Timer object was returned");
    ok(bb.cancel(timer), "Cancel returned true");
    ok(!functionWasCalled, "function was not called");
  });
});

test("setTimeout", function() {
  expect(3);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  var timer = bb.setTimeout(function() {
    functionWasCalled = true;
  }, 0);

  ok(timer, "Timer object was returned");
  ok(bb.cancel(timer), "Cancel returned true");
  ok(!functionWasCalled, "function was not called");
});

test("cancelTimers", function() {
  var bb = new Backburner(['one']),
      functionWasCalled = false;

  var timer = bb.setTimeout(function() {
    functionWasCalled = true;
  }, 0);

  ok(timer, "Timer object was returned");
  ok(bb.hasTimers(), "bb has scheduled timer");

  bb.cancelTimers();

  ok(!bb.hasTimers(), "bb has no scheduled timer");
  ok(!functionWasCalled, "function was not called");
});

test("cancel during flush", function() {
  expect(1);

  var bb = new Backburner(['one']),
  functionWasCalled = false;

  bb.run(function() {
    var timer1 = bb.deferOnce('one', function() {
      bb.cancel(timer2);
    });

    var timer2 = bb.deferOnce('one', function() {
      functionWasCalled = true;
    });
  });

  ok(!functionWasCalled, "function was not called");
});
