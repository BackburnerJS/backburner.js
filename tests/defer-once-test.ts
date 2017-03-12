import Backburner from 'backburner';

QUnit.module('tests/defer-once');

QUnit.test('when passed a function', function(assert) {
  assert.expect(1);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    bb.deferOnce('one', () => {
      functionWasCalled = true;
    });
  });

  assert.ok(functionWasCalled, 'function was called');
});

QUnit.test('when passed a target and method', function(assert) {
  assert.expect(2);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    bb.deferOnce('one', {zomg: 'hi'}, function() {
      assert.equal(this.zomg, 'hi', 'the target was properly set');
      functionWasCalled = true;
    });
  });

  assert.ok(functionWasCalled, 'function was called');
});

QUnit.test('when passed a target and method name', function(assert) {
  assert.expect(2);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;
  let targetObject = {
    zomg: 'hi',
    checkFunction() {
      assert.equal(this.zomg, 'hi', 'the target was properly set');
      functionWasCalled = true;
    }
  };

  bb.run(() => bb.deferOnce('one', targetObject, 'checkFunction'));

  assert.ok(functionWasCalled, 'function was called');
});

QUnit.test('throws when passed a null method', function(assert) {
  assert.expect(1);

  function onError(error) {
    assert.equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  let bb = new Backburner(['deferErrors'], {
    onError
  });

  bb.run(() => bb.deferOnce('deferErrors', {zomg: 'hi'}, null));
});

QUnit.test('throws when passed an undefined method', function(assert) {
  assert.expect(1);

  function onError(error) {
    assert.equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  let bb = new Backburner(['deferErrors'], {
    onError
  });

  bb.run(() => bb.deferOnce('deferErrors', {zomg: 'hi'}, undefined));
});

QUnit.test('throws when passed an method name that does not exists on the target', function(assert) {
  assert.expect(1);

  function onError(error) {
    assert.equal('You attempted to schedule an action in a queue (deferErrors) for a method that doesn\'t exist', error.message);
  }

  let bb = new Backburner(['deferErrors'], {
    onError
  });

  bb.run(() => bb.deferOnce('deferErrors', {zomg: 'hi'}, 'checkFunction'));
});

QUnit.test('when passed a target, method, and arguments', function(assert) {
  assert.expect(5);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    bb.deferOnce('one', {zomg: 'hi'}, function(a, b, c) {
      assert.equal(this.zomg, 'hi', 'the target was properly set');
      assert.equal(a, 1, 'the first arguments was passed in');
      assert.equal(b, 2, 'the second arguments was passed in');
      assert.equal(c, 3, 'the third arguments was passed in');
      functionWasCalled = true;
    }, 1, 2, 3);
  });

  assert.ok(functionWasCalled, 'function was called');
});

QUnit.test('when passed same function twice', function(assert) {
  assert.expect(2);

  let bb = new Backburner(['one']);
  let i = 0;
  let functionWasCalled = false;

  function deferMethod() {
    i++;
    assert.equal(i, 1, 'Function should be called only once');
    functionWasCalled = true;
  }

  bb.run(() => {
    bb.deferOnce('one', deferMethod);
    bb.deferOnce('one', deferMethod);
  });

  assert.ok(functionWasCalled, 'function was called only once');
});

QUnit.test('when passed same function twice with same target', function(assert) {
  assert.expect(3);

  let bb = new Backburner(['one']);
  let i = 0;
  let functionWasCalled = false;

  function deferMethod() {
    i++;
    assert.equal(i, 1, 'Function should be called only once');
    assert.equal(this['first'], 1, 'the target property was set');
    functionWasCalled = true;
  }

  let argObj = {first: 1};

  bb.run(() => {
    bb.deferOnce('one', argObj, deferMethod);
    bb.deferOnce('one', argObj, deferMethod);
  });

  assert.ok(functionWasCalled, 'function was called only once');
});

QUnit.test('when passed same function twice with different targets', function(assert) {
  assert.expect(3);

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod() {
    i++;
    assert.equal(this['first'], 1, 'the target property was set');
  }

  bb.run(() => {
    bb.deferOnce('one', {first: 1}, deferMethod);
    bb.deferOnce('one', {first: 1}, deferMethod);
  });

  assert.equal(i, 2, 'function was called twice');
});

QUnit.test('when passed same function twice with same arguments and same target', function(assert) {
  assert.expect(4);

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod(a, b) {
    i++;
    assert.equal(a, 1, 'First argument is set only one time');
    assert.equal(b, 2, 'Second argument remains same');
    assert.equal(this['first'], 1, 'the target property was set');
  }

  let argObj = {first: 1};

  bb.run(() => {
    bb.deferOnce('one', argObj, deferMethod, 1, 2);
    bb.deferOnce('one', argObj, deferMethod, 1, 2);
  });

  assert.equal(i, 1, 'function was called once');
});

QUnit.test('when passed same function twice with same target and different arguments', function(assert) {
  assert.expect(4);

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod(a, b) {
    i++;
    assert.equal(a, 3, 'First argument of only second call is set');
    assert.equal(b, 2, 'Second argument remains same');
    assert.equal(this['first'], 1, 'the target property was set');
  }

  let argObj = {first: 1};

  bb.run(() => {
    bb.deferOnce('one', argObj, deferMethod, 1, 2);
    bb.deferOnce('one', argObj, deferMethod, 3, 2);
  });

  assert.equal(i, 1, 'function was called once');
});

QUnit.test('when passed same function twice with different target and different arguments', function(assert) {
  assert.expect(7);

  let bb = new Backburner(['one']);
  let i = 0;

  function deferMethod(a, b) {
    i++;
    if (i === 1) {
      assert.equal(a, 1, 'First argument set during first call');
    } else {
      assert.equal(a, 3, 'First argument set during second call');
    }
    assert.equal(b, 2, 'Second argument remains same');
    assert.equal(this['first'], 1, 'the target property was set');
  }

  let argObj = {first: 1};

  bb.run(() => {
    bb.deferOnce('one', {first: 1}, deferMethod, 1, 2);
    bb.deferOnce('one', {first: 1}, deferMethod, 3, 2);
  });

  assert.equal(i, 2, 'function was called twice');
});

QUnit.test('when passed same function with same target after already triggering in current loop (GUID_KEY)', function(assert) {
  assert.expect(5);

  let bb = new Backburner(['one', 'two'], { GUID_KEY: 'GUID_KEY' });
  let i = 0;

  function deferMethod(a) {
    i++;
    assert.equal(a, i, 'Correct argument is set');
    assert.equal(this['first'], 1, 'the target property was set');
  }

  function scheduleMethod() {
    bb.deferOnce('one', argObj, deferMethod, 2);
  }

  let argObj = {first: 1, GUID_KEY: '1'};

  bb.run(() => {
    bb.deferOnce('one', argObj, deferMethod, 1);
    bb.deferOnce('two', argObj, scheduleMethod);
  });

  assert.equal(i, 2, 'function was called twice');
});

QUnit.test('onError', function(assert) {
  assert.expect(1);

  function onError(error) {
    assert.equal('QUnit.test error', error.message);
  }

  let bb = new Backburner(['errors'], { onError });

  bb.run(() => {
    bb.deferOnce('errors', () => {
      throw new Error('QUnit.test error');
    });
  });
});
