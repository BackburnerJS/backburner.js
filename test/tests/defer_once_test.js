import { Backburner } from "backburner";

module("deferOnce");

test("when passed a function", function() {
  expect(1);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    bb.deferOnce('one', function() {
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, "function was called");
});

test("when passed a target and method", function() {
  expect(2);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    bb.deferOnce('one', {zomg: "hi"}, function() {
      equal(this.zomg, "hi", "the target was properly set");
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, "function was called");
});

test("when passed a target, method, and arguments", function() {
  expect(5);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    bb.deferOnce('one', {zomg: "hi"}, function(a, b, c) {
      equal(this.zomg, "hi", "the target was properly set");
      equal(a, 1, "the first arguments was passed in");
      equal(b, 2, "the second arguments was passed in");
      equal(c, 3, "the third arguments was passed in");
      functionWasCalled = true;
    }, 1, 2, 3);
  });

  ok(functionWasCalled, "function was called");
});
