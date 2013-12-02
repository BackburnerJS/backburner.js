import { Backburner } from "backburner";

module("run");

test("when passed a function", function() {
  expect(1);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    functionWasCalled = true;
  });

  ok(functionWasCalled, "function was called");
});

test("when passed a target and method", function() {
  expect(2);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run({zomg: "hi"}, function() {
    equal(this.zomg, "hi", "the target was properly set");
    functionWasCalled = true;
  });

  ok(functionWasCalled, "function was called");
});

test("when passed a target, method, and arguments", function() {
  expect(5);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run({zomg: "hi"}, function(a, b, c) {
    equal(this.zomg, "hi", "the target was properly set");
    equal(a, 1, "the first arguments was passed in");
    equal(b, 2, "the second arguments was passed in");
    equal(c, 3, "the third arguments was passed in");
    functionWasCalled = true;
  }, 1, 2, 3);

  ok(functionWasCalled, "function was called");
});

test("nesting run loops preserves the stack", function() {
  expect(10);

  var bb = new Backburner(['one']),
    outerBeforeFunctionWasCalled = false,
    middleBeforeFunctionWasCalled = false,
    innerFunctionWasCalled = false,
    middleAfterFunctionWasCalled = false,
    outerAfterFunctionWasCalled = false;

  bb.run(function () {
    bb.defer('one', function () {
      outerBeforeFunctionWasCalled = true;
    });

    bb.run(function () {
      bb.defer('one', function () {
        middleBeforeFunctionWasCalled = true;
      });

      bb.run(function () {
        bb.defer('one', function () {
          innerFunctionWasCalled = true;
        });
        ok(!innerFunctionWasCalled, "function is deferred");
      });
      ok(innerFunctionWasCalled, "function is called");

      bb.defer('one', function () {
        middleAfterFunctionWasCalled = true;
      });

      ok(!middleBeforeFunctionWasCalled, "function is deferred");
      ok(!middleAfterFunctionWasCalled, "function is deferred");
    });

    ok(middleBeforeFunctionWasCalled, "function is called");
    ok(middleAfterFunctionWasCalled, "function is called");

    bb.defer('one', function () {
      outerAfterFunctionWasCalled = true;
    });

    ok(!outerBeforeFunctionWasCalled, "function is deferred");
    ok(!outerAfterFunctionWasCalled, "function is deferred");
  });

  ok(outerBeforeFunctionWasCalled, "function is called");
  ok(outerAfterFunctionWasCalled, "function is called");
});

test("runs can be nested", function() {
  expect(2);

  var bb = new Backburner(['one']),
      step = 0;

  bb.run(function() {
    equal(step++, 0);

    bb.run(function() {
      equal(step++, 1);
    });
  });
});
