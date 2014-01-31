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

test("when passed same function twice", function() {
  expect(2);

  var bb = new Backburner(['one']),
      i=0,
      functionWasCalled=false,
      deferMethod = function(){
        i++;
        equal(i, 1, "Function should be called only once");
        functionWasCalled = true;
      };

  bb.run(function() {
    bb.deferOnce('one', deferMethod);
    bb.deferOnce('one', deferMethod);
  });

  ok(functionWasCalled, "function was called only once");
});

test("when passed same function twice with same arguments", function() {
  expect(3);

  var bb = new Backburner(['one']),
      i=0,
      functionWasCalled=false,
      deferMethod = function(){
        i++;
        equal(i, 1, "Function should be called only once");
        equal(this["first"], 1, "the target property was set");
        functionWasCalled = true;
      },
      argObj = {"first": 1};

  bb.run(function() {
    bb.deferOnce('one', argObj, deferMethod);
    bb.deferOnce('one', argObj, deferMethod);
  });

  ok(functionWasCalled, "function was called only once");
});

test("when passed same function twice with different arguments", function() {
  expect(3);

  var bb = new Backburner(['one']),
      i=0,
      deferMethod = function(){
        i++;
        equal(this["first"], 1, "the target property was set");
      };

  bb.run(function() {
    bb.deferOnce('one', {"first": 1}, deferMethod);
    bb.deferOnce('one', {"first": 1}, deferMethod);
  });

  equal(i, 2, "function was called twice");
});
