import Backburner from 'backburner';

QUnit.module('tests/run');

QUnit.test('when passed a function', function(assert) {
  assert.expect(1);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => functionWasCalled = true);

  assert.ok(functionWasCalled, 'function was called');
});

QUnit.test('when passed a target and method', function(assert) {
  assert.expect(2);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run({zomg: 'hi'}, function() {
    assert.equal(this.zomg, 'hi', 'the target was properly set');
    functionWasCalled = true;
  });

  assert.ok(functionWasCalled, 'function was called');
});

QUnit.test('when passed a target, method, and arguments', function(assert) {
  assert.expect(5);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run({zomg: 'hi'}, function(a, b, c) {
    assert.equal(this.zomg, 'hi', 'the target was properly set');
    assert.equal(a, 1, 'the first arguments was passed in');
    assert.equal(b, 2, 'the second arguments was passed in');
    assert.equal(c, 3, 'the third arguments was passed in');
    functionWasCalled = true;
  }, 1, 2, 3);

  assert.ok(functionWasCalled, 'function was called');
});

QUnit.test('nesting run loops preserves the stack', function(assert) {
  assert.expect(10);

  let bb = new Backburner(['one']);
  let outerBeforeFunctionWasCalled = false;
  let middleBeforeFunctionWasCalled = false;
  let innerFunctionWasCalled = false;
  let middleAfterFunctionWasCalled = false;
  let outerAfterFunctionWasCalled = false;

  bb.run(function() {
    bb.schedule('one', () => {
      outerBeforeFunctionWasCalled = true;
    });

    bb.run(function() {
      bb.schedule('one', () => {
        middleBeforeFunctionWasCalled = true;
      });

      bb.run(function() {
        bb.schedule('one', function() {
          innerFunctionWasCalled = true;
        });
        assert.ok(!innerFunctionWasCalled, 'function is deferred');
      });
      assert.ok(innerFunctionWasCalled, 'function is called');

      bb.schedule('one', function() {
        middleAfterFunctionWasCalled = true;
      });

      assert.ok(!middleBeforeFunctionWasCalled, 'function is deferred');
      assert.ok(!middleAfterFunctionWasCalled, 'function is deferred');
    });

    assert.ok(middleBeforeFunctionWasCalled, 'function is called');
    assert.ok(middleAfterFunctionWasCalled, 'function is called');

    bb.schedule('one', function() {
      outerAfterFunctionWasCalled = true;
    });

    assert.ok(!outerBeforeFunctionWasCalled, 'function is deferred');
    assert.ok(!outerAfterFunctionWasCalled, 'function is deferred');
  });

  assert.ok(outerBeforeFunctionWasCalled, 'function is called');
  assert.ok(outerAfterFunctionWasCalled, 'function is called');
});

QUnit.test('runs can be nested', function(assert) {
  assert.expect(2);

  let bb = new Backburner(['one']);
  let step = 0;

  bb.run(function() {
    assert.equal(step++, 0);

    bb.run(function() {
      assert.equal(step++, 1);
    });
  });
});

QUnit.test('run returns value', function(assert) {
  let bb = new Backburner(['one']);

  let value = bb.run(function() {
    return 'hi';
  });

  assert.equal(value, 'hi');
});

QUnit.test('onError', function(assert) {
  assert.expect(1);

  function onError(error) {
    assert.equal('QUnit.test error', error.message);
  }

  let bb = new Backburner(['errors'], {
    onError: onError
  });

  bb.run(function() {
    throw new Error('QUnit.test error');
  });
});

QUnit.test('onError set after start', function(assert) {
  assert.expect(2);

  let bb = new Backburner(['errors']);

  bb.run(() => assert.ok(true));

  bb.options.onError = function(error) {
    assert.equal('QUnit.test error', error.message);
  };

  bb.run(() => { throw new Error('QUnit.test error'); });
});

QUnit.test('onError with target and action', function(assert) {
  assert.expect(3);

  let target = {};

  let bb = new Backburner(['errors'], {
    onErrorTarget: target,
    onErrorMethod: 'onerror'
  });

  bb.run(() => assert.ok(true));

  target['onerror'] = function(error) {
    assert.equal('QUnit.test error', error.message);
  };

  bb.run(() => { throw new Error('QUnit.test error'); });

  target['onerror'] = function() { };

  bb.run(() => { throw new Error('QUnit.test error'); });

  target['onerror'] = function(error) {
    assert.equal('QUnit.test error', error.message);
  };

  bb.run(() => { throw new Error('QUnit.test error'); });
});
