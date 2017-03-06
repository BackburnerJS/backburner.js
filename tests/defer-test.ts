import Backburner from 'backburner';
var originalDateValueOf = Date.prototype.valueOf;

QUnit.module('defer', {
  teardown: function(){
    Date.prototype.valueOf = originalDateValueOf;
  }
});

test('when passed a function', function() {
  expect(1);

  var bb = new Backburner(['one']);
  var functionWasCalled = false;

  bb.run(function() {
    bb.defer('one', function() {
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, 'function was called');
});

test('when passed a target and method', function() {
  expect(2);

  var bb = new Backburner(['one']);
  var functionWasCalled = false;

  bb.run(function() {
    bb.defer('one', {zomg: 'hi'}, function() {
      equal(this.zomg, 'hi', 'the target was properly set');
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, 'function was called');
});

test('when passed a target and method name', function() {
  expect(2);

  var bb = new Backburner(['one']);
  var functionWasCalled = false;
  var targetObject = {
    zomg: 'hi',
    checkFunction: function() {
      equal(this.zomg, 'hi', 'the target was properly set');
      functionWasCalled = true;
    }
  };

  bb.run(function() {
    bb.defer('one', targetObject, 'checkFunction');
  });

  ok(functionWasCalled, 'function was called');
});

test('throws when passed a null method', function() {
  expect(1);

  function onError(error) {
    equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  var bb = new Backburner(['deferErrors'], {
    onError: onError
  });

  bb.run(function() {
    bb.defer('deferErrors', {zomg: 'hi'}, null);
  });
});

test('throws when passed an undefined method', function() {
  expect(1);

  function onError(error) {
    equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  var bb = new Backburner(['deferErrors'], {
    onError: onError
  });

  bb.run(function() {
    bb.defer('deferErrors', {zomg: 'hi'}, undefined);
  });
});

test('throws when passed an method name that does not exists on the target', function() {
  expect(1);

  function onError(error) {
    equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  var bb = new Backburner(['deferErrors'], {
    onError: onError
  });

  bb.run(function() {
    bb.defer('deferErrors', {zomg: 'hi'}, 'checkFunction');
  });
});

test('when passed a target, method, and arguments', function() {
  expect(5);

  var bb = new Backburner(['one']);
  var functionWasCalled = false;

  bb.run(function() {
    bb.defer('one', {zomg: 'hi'}, function(a, b, c) {
      equal(this.zomg, 'hi', 'the target was properly set');
      equal(a, 1, 'the first arguments was passed in');
      equal(b, 2, 'the second arguments was passed in');
      equal(c, 3, 'the third arguments was passed in');
      functionWasCalled = true;
    }, 1, 2, 3);
  });

  ok(functionWasCalled, 'function was called');
});

test('when passed same function twice', function() {
  expect(1);

  var bb = new Backburner(['one']);
  var i = 0;
  var deferMethod = function(){
    i++;
  };

  bb.run(function() {
    bb.defer('one', deferMethod);
    bb.defer('one', deferMethod);
  });

  equal(i, 2, 'function was called twice');
});

test('when passed same function twice with arguments', function() {
  expect(2);

  var bb = new Backburner(['one']);
  var i = 0;
  var deferMethod = function(){
        equal(this['first'], 1, 'the target property was set');
      };
  var argObj = {first : 1};

  bb.run(function() {
    bb.defer('one', argObj, deferMethod);
    bb.defer('one', argObj, deferMethod);
  });

});

test('when passed same function twice with same arguments and same target', function() {
  expect(7);

  var bb = new Backburner(['one']);
  var i = 0;
  var deferMethod = function(a, b){
    i++;
    equal(a, 1, 'First argument is set twice');
    equal(b, 2, 'Second argument is set twice');
    equal(this['first'], 1, 'the target property was set');
  };
  var argObj = {first: 1};

  bb.run(function() {
    bb.defer('one', argObj, deferMethod, 1, 2);
    bb.defer('one', argObj, deferMethod, 1, 2);
  });

  equal(i, 2, 'function was called twice');
});

test('when passed same function twice with same target and different arguments', function() {
  expect(7);

  var bb = new Backburner(['one']);
  var i = 0;
  var deferMethod = function(a, b){
    i++;
    if (i === 1) {
      equal(a, 1, 'First argument set during first call');
    } else {
      equal(a, 3, 'First argument set during second call');
    }
    equal(b, 2, 'Second argument remains same');
    equal(this['first'], 1, 'the target property was set');
  };
  var argObj = {first: 1};

  bb.run(function() {
    bb.defer('one', argObj, deferMethod, 1, 2);
    bb.defer('one', argObj, deferMethod, 3, 2);
  });

  equal(i, 2, 'function was called twice');
});

test('when passed same function twice with different target and different arguments', function() {
  expect(7);

  var bb = new Backburner(['one']);
  var i = 0;
  var deferMethod = function(a, b){
    i++;
    if (i === 1) {
      equal(a, 1, 'First argument set during first call');
    } else {
      equal(a, 3, 'First argument set during second call');
    }
    equal(b, 2, 'Second argument remains same');
    equal(this['first'], 1, 'the target property was set');
  };
  var argObj = {first: 1};

  bb.run(function() {
    bb.defer('one', {first: 1}, deferMethod, 1, 2);
    bb.defer('one', {first: 1}, deferMethod, 3, 2);
  });

  equal(i, 2, 'function was called twice');
});

test('onError', function() {
  expect(1);

  function onError(error) {
    equal('test error', error.message);
  }

  var bb = new Backburner(['errors'], {
    onError: onError
  });

  bb.run(function() {
    bb.defer('errors', function() {
      throw new Error('test error');
    });
  });
});
