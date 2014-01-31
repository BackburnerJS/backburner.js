import { Backburner } from "backburner";
var originalDateValueOf = Date.prototype.valueOf;

module("defer", {
  teardown: function(){
    Date.prototype.valueOf = originalDateValueOf;
  }
});

test("when passed a function", function() {
  expect(1);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    bb.defer('one', function() {
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
    bb.defer('one', {zomg: "hi"}, function() {
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
    bb.defer('one', {zomg: "hi"}, function(a, b, c) {
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
  expect(1);

  var bb = new Backburner(['one']),
      i=0,
      deferMethod = function(){
        i++;
      };

  bb.run(function() {
    bb.defer('one', deferMethod);
    bb.defer('one', deferMethod);
  });

  equal(i, 2, "function was called twice");
});


test("when passed same function twice with arguments", function() {
  expect(2);

  var bb = new Backburner(['one']),
      i=0,
      deferMethod = function(){
        equal(this["first"], 1, "the target property was set");
      },
      argObj = {'first' : 1};

  bb.run(function() {
    bb.defer('one', argObj, deferMethod);
    bb.defer('one', argObj, deferMethod);
  });

});