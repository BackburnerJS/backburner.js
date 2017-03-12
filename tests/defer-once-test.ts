import Backburner from 'backburner';

QUnit.module('deferOnce');

test('when passed a function', function() {
  expect(1);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    bb.deferOnce('one', () => {
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
    bb.deferOnce('one', {zomg: 'hi'}, function() {
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
    checkFunction: function() {
      equal(this.zomg, 'hi', 'the target was properly set');
      functionWasCalled = true;
    }
  };

  bb.run(() => bb.deferOnce('one', targetObject, 'checkFunction'));

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

  bb.run(() => bb.deferOnce('deferErrors', {zomg: 'hi'}, null));
});

test('throws when passed an undefined method', function() {
  expect(1);

  function onError(error) {
    equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  let bb = new Backburner(['deferErrors'], {
    onError
  });

  bb.run(() => bb.deferOnce('deferErrors', {zomg: 'hi'}, undefined));
});

test('throws when passed an method name that does not exists on the target', function() {
  expect(1);

  function onError(error) {
    equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  let bb = new Backburner(['deferErrors'], {
    onError
  });

  bb.run(() => bb.deferOnce('deferErrors', {zomg: 'hi'}, 'checkFunction'));
});

test('when passed a target, method, and arguments', function() {
  expect(5);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    bb.deferOnce('one', {zomg: 'hi'}, function(a, b, c) {
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
  expect(2);

  let bb = new Backburner(['one']);
  let i = 0;
  let functionWasCalled = false;

  function deferMethod() {
    i++;
    equal(i, 1, 'Function should be called only once');
    functionWasCalled = true;
  }

  bb.run(() => {
    bb.deferOnce('one', deferMethod);
    bb.deferOnce('one', deferMethod);
  });

  ok(functionWasCalled, 'function was called only once');
});

test('when passed same function twice with same target', function() {
  expect(3);

  let bb = new Backburner(['one']);
  let i = 0;
  let functionWasCalled = false;

  function deferMethod() {
    i++;
    equal(i, 1, 'Function should be called only once');
    equal(this['first'], 1, 'the target property was set');
    functionWasCalled = true;
  }

  let argObj = {first: 1};

  bb.run(() => {
    bb.deferOnce('one', argObj, deferMethod);
    bb.deferOnce('one', argObj, deferMethod);
  });

  ok(functionWasCalled, 'function was called only once');
});

test('when passed same function twice with different targets', function() {
  expect(3);

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod() {
    i++;
    equal(this['first'], 1, 'the target property was set');
  }

  bb.run(() => {
    bb.deferOnce('one', {first: 1}, deferMethod);
    bb.deferOnce('one', {first: 1}, deferMethod);
  });

  equal(i, 2, 'function was called twice');
});

test('when passed same function twice with same arguments and same target', function() {
  expect(4);

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod(a, b) {
    i++;
    equal(a, 1, 'First argument is set only one time');
    equal(b, 2, 'Second argument remains same');
    equal(this['first'], 1, 'the target property was set');
  }

  let argObj = {first: 1};

  bb.run(() => {
    bb.deferOnce('one', argObj, deferMethod, 1, 2);
    bb.deferOnce('one', argObj, deferMethod, 1, 2);
  });

  equal(i, 1, 'function was called once');
});

test('when passed same function twice with same target and different arguments', function() {
  expect(4);

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod(a, b) {
    i++;
    equal(a, 3, 'First argument of only second call is set');
    equal(b, 2, 'Second argument remains same');
    equal(this['first'], 1, 'the target property was set');
  }

  let argObj = {first: 1};

  bb.run(() => {
    bb.deferOnce('one', argObj, deferMethod, 1, 2);
    bb.deferOnce('one', argObj, deferMethod, 3, 2);
  });

  equal(i, 1, 'function was called once');
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
    bb.deferOnce('one', {first: 1}, deferMethod, 1, 2);
    bb.deferOnce('one', {first: 1}, deferMethod, 3, 2);
  });

  equal(i, 2, 'function was called twice');
});

test('when passed same function with same target after already triggering in current loop (GUID_KEY)', function() {
  expect(5);

  let bb = new Backburner(['one', 'two'], { GUID_KEY: 'GUID_KEY' });
  let i = 0;

  function deferMethod(a) {
    i++;
    equal(a, i, 'Correct argument is set');
    equal(this['first'], 1, 'the target property was set');
  }

  function scheduleMethod() {
    bb.deferOnce('one', argObj, deferMethod, 2);
  }

  let argObj = {first: 1, GUID_KEY: '1'};

  bb.run(() => {
    bb.deferOnce('one', argObj, deferMethod, 1);
    bb.deferOnce('two', argObj, scheduleMethod);
  });

  equal(i, 2, 'function was called twice');
});

test('onError', function() {
  expect(1);

  function onError(error) {
    equal('test error', error.message);
  }

  let bb = new Backburner(['errors'], { onError: onError });

  bb.run(() => {
    bb.deferOnce('errors', () => {
      throw new Error('test error');
    });
  });
});
