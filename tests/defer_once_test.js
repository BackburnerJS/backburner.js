import Backburner from "backburner";

module("deferOnce");

test("when passed a function", function() {
  expect(1);

  var bb = new Backburner(['one']);
  var functionWasCalled = false;

  bb.run(function() {
    bb.deferOnce('one', function() {
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, "function was called");
});

test("when passed a target and method", function() {
  expect(2);

  var bb = new Backburner(['one']);
  var functionWasCalled = false;

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

  var bb = new Backburner(['one']);
  var functionWasCalled = false;

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

  var bb = new Backburner(['one']);
  var i = 0;
  var functionWasCalled=false;
  var deferMethod = function(){
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

test("when passed same function twice with same target", function() {
  expect(3);

  var bb = new Backburner(['one']);
  var i=0;
  var functionWasCalled=false;
  var deferMethod = function(){
    i++;
    equal(i, 1, "Function should be called only once");
    equal(this["first"], 1, "the target property was set");
    functionWasCalled = true;
  };
  var argObj = {"first": 1};

  bb.run(function() {
    bb.deferOnce('one', argObj, deferMethod);
    bb.deferOnce('one', argObj, deferMethod);
  });

  ok(functionWasCalled, "function was called only once");
});

test("when passed same function twice with different targets", function() {
  expect(3);

  var bb = new Backburner(['one']);
  var i = 0;
  var deferMethod = function(){
    i++;
    equal(this["first"], 1, "the target property was set");
  };

  bb.run(function() {
    bb.deferOnce('one', {"first": 1}, deferMethod);
    bb.deferOnce('one', {"first": 1}, deferMethod);
  });

  equal(i, 2, "function was called twice");
});

test("when passed same function twice with same arguments and same target", function() {
  expect(4);

  var bb = new Backburner(['one']);
  var i = 0;
  var deferMethod = function(a, b){
    i++;
    equal(a, 1, 'First argument is set only one time');
    equal(b, 2, 'Second argument remains same');
    equal(this["first"], 1, "the target property was set");
  };
  var argObj = {'first': 1};

  bb.run(function() {
    bb.deferOnce('one', argObj, deferMethod, 1, 2);
    bb.deferOnce('one', argObj, deferMethod, 1, 2);
  });

  equal(i, 1, "function was called once");
});

test("when passed same function twice with same target and different arguments", function() {
  expect(4);

  var bb = new Backburner(['one']);
  var i=0;
  var deferMethod = function(a, b){
    i++;
    equal(a, 3, 'First argument of only second call is set');
    equal(b, 2, 'Second argument remains same');
    equal(this["first"], 1, "the target property was set");
  };
  var argObj = {'first': 1};

  bb.run(function() {
    bb.deferOnce('one', argObj, deferMethod, 1, 2);
    bb.deferOnce('one', argObj, deferMethod, 3, 2);
  });

  equal(i, 1, "function was called once");
});

test("when passed same function twice with different target and different arguments", function() {
  expect(7);

  var bb = new Backburner(['one']);
  var i = 0;
  var deferMethod = function(a, b){
    i++;
    if(i === 1){
      equal(a, 1, 'First argument set during first call');
    } else {
      equal(a, 3, 'First argument set during second call');
    }
    equal(b, 2, 'Second argument remains same');
    equal(this["first"], 1, "the target property was set");
  };
  var argObj = {'first': 1};

  bb.run(function() {
    bb.deferOnce('one', {"first": 1}, deferMethod, 1, 2);
    bb.deferOnce('one', {"first": 1}, deferMethod, 3, 2);
  });

  equal(i, 2, "function was called twice");
});

test("onError", function() {
  expect(1);

  function onError(error) {
    equal("test error", error.message);
  }

  var bb = new Backburner(['errors'], { onError: onError });

  bb.run(function() {
    bb.deferOnce('errors', function() {
      throw new Error("test error");
    });
  });
});

