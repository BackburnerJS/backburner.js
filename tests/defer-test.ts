import Backburner from 'backburner';
let originalDateValueOf = Date.prototype.valueOf;

QUnit.module('defer', {
  teardown: function(){
    Date.prototype.valueOf = originalDateValueOf;
  }
});

test('when passed a function', function() {
  expect(1);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    bb.defer('one', function() {
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, 'function was called');
});

test('when passed a target and method', function() {
  expect(2);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    bb.defer('one', {zomg: 'hi'}, function() {
      equal(this.zomg, 'hi', 'the target was properly set');
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, 'function was called');
});

test('when passed a target and method name', function() {
  expect(2);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;
  let targetObject = {
    zomg: 'hi',
    checkFunction() {
      equal(this.zomg, 'hi', 'the target was properly set');
      functionWasCalled = true;
    }
  };

  bb.run(() => bb.defer('one', targetObject, 'checkFunction'));

  ok(functionWasCalled, 'function was called');
});

test('throws when passed a null method', function() {
  expect(1);

  function onError(error) {
    equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  let bb = new Backburner(['deferErrors'], {
    onError
  });

  bb.run(() => bb.defer('deferErrors', {zomg: 'hi'}, null));
});

test('throws when passed an undefined method', function() {
  expect(1);

  function onError(error) {
    equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  let bb = new Backburner(['deferErrors'], {
    onError
  });

  bb.run(() => bb.defer('deferErrors', {zomg: 'hi'}, undefined));
});

test('throws when passed an method name that does not exists on the target', function() {
  expect(1);

  function onError(error) {
    equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  let bb = new Backburner(['deferErrors'], {
    onError
  });

  bb.run(() => bb.defer('deferErrors', {zomg: 'hi'}, 'checkFunction'));
});

test('when passed a target, method, and arguments', function() {
  expect(5);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
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

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod() {
    i++;
  }

  bb.run(() => {
    bb.defer('one', deferMethod);
    bb.defer('one', deferMethod);
  });

  equal(i, 2, 'function was called twice');
});

test('when passed same function twice with arguments', function() {
  expect(2);

  let bb = new Backburner(['one']);
  let i = 0;
  let argObj = {first : 1};

  function deferMethod() {
    equal(this['first'], 1, 'the target property was set');
  }

  bb.run(() => {
    bb.defer('one', argObj, deferMethod);
    bb.defer('one', argObj, deferMethod);
  });
});

test('when passed same function twice with same arguments and same target', function() {
  expect(7);

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod(a, b) {
    i++;
    equal(a, 1, 'First argument is set twice');
    equal(b, 2, 'Second argument is set twice');
    equal(this['first'], 1, 'the target property was set');
  }

  let argObj = {first: 1};

  bb.run(() => {
    bb.defer('one', argObj, deferMethod, 1, 2);
    bb.defer('one', argObj, deferMethod, 1, 2);
  });

  equal(i, 2, 'function was called twice');
});

test('when passed same function twice with same target and different arguments', function() {
  expect(7);

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod(a, b) {
    i++;
    if (i === 1) {
      equal(a, 1, 'First argument set during first call');
    } else {
      equal(a, 3, 'First argument set during second call');
    }
    equal(b, 2, 'Second argument remains same');
    equal(this['first'], 1, 'the target property was set');
  }

  let argObj = {first: 1};

  bb.run(() => {
    bb.defer('one', argObj, deferMethod, 1, 2);
    bb.defer('one', argObj, deferMethod, 3, 2);
  });

  equal(i, 2, 'function was called twice');
});

test('when passed same function twice with different target and different arguments', function() {
  expect(7);

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod(a, b) {
    i++;
    if (i === 1) {
      equal(a, 1, 'First argument set during first call');
    } else {
      equal(a, 3, 'First argument set during second call');
    }
    equal(b, 2, 'Second argument remains same');
    equal(this['first'], 1, 'the target property was set');
  }

  let argObj = {first: 1};

  bb.run(() => {
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

  let bb = new Backburner(['errors'], {
    onError
  });

  bb.run(() => {
    bb.defer('errors', () => {
      throw new Error('test error');
    });
  });
});
