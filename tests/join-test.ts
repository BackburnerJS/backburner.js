import Backburner from 'backburner';

QUnit.module('tests/join');

function depth(bb) {
  return bb.instanceStack.length + (bb.currentInstance ? 1 : 0);
}

QUnit.test('outside of a run loop', function(assert) {
  assert.expect(4);

  let bb = new Backburner(['one']);

  assert.equal(depth(bb), 0);
  let result = bb.join(function() {
    assert.equal(depth(bb), 1);
    return 'result';
  });
  assert.equal(result, 'result');
  assert.equal(depth(bb), 0);
});

QUnit.test('inside of a run loop', function(assert) {
  assert.expect(4);

  let bb = new Backburner(['one']);

  assert.equal(depth(bb), 0);
  bb.run(function() {
    let result = bb.join(function() {
      assert.equal(depth(bb), 1);
      return 'result';
    });
    assert.equal(result, 'result');
  });
  assert.equal(depth(bb), 0);
});

QUnit.test('nested join calls', function(assert) {
  assert.expect(7);

  let bb = new Backburner(['one']);

  assert.equal(depth(bb), 0);
  bb.join(function() {
    assert.equal(depth(bb), 1);
    bb.join(function() {
      assert.equal(depth(bb), 1);
      bb.join(function() {
        assert.equal(depth(bb), 1);
      });
      assert.equal(depth(bb), 1);
    });
    assert.equal(depth(bb), 1);
  });
  assert.equal(depth(bb), 0);
});

QUnit.test('nested run loops', function(assert) {
  assert.expect(7);

  let bb = new Backburner(['one']);

  assert.equal(depth(bb), 0);
  bb.join(function() {
    assert.equal(depth(bb), 1);
    bb.run(function() {
      assert.equal(depth(bb), 2);
      bb.join(function() {
        assert.equal(depth(bb), 2);
      });
      assert.equal(depth(bb), 2);
    });
    assert.equal(depth(bb), 1);
  });
  assert.equal(depth(bb), 0);
});

QUnit.test('queue execution order', function(assert) {
  assert.expect(1);

  let bb = new Backburner(['one']);
  let items: number[] = [];

  bb.run(function() {
    items.push(0);
    bb.schedule('one', () => items.push(4));
    bb.join(function() {
      items.push(1);
      bb.schedule('one', () => items.push(5));
      items.push(2);
    });
    bb.schedule('one', () => items.push(6));
    items.push(3);
  });
  assert.deepEqual(items, [0, 1, 2, 3, 4, 5, 6]);
});

QUnit.test('without an onError run.join can be caught via `try`/`catch`', function(assert) {
  assert.expect(1);

  let bb = new Backburner(['errors']);

  assert.throws(() => {
    bb.join(() => {
      throw new Error('test error');
    });
  }, /test error/);
});

QUnit.test('with an onError which does not rethrow, when joining existing instance, can be caught via `try`/`catch`', function(assert) {
  assert.expect(1);

  let bb = new Backburner(['errors'], {
    onError(error) {
      assert.notOk(true, 'onError should not be called as the error from .join is handled by assert.throws');
    }
  });

  bb.run(() => {
    assert.throws(() => {
      bb.join(() => {
        throw new Error('test error');
      });
    }, /test error/, 'error from within .join can be caught with try/catch');
  });
});

QUnit.test('onError which does not rethrow is invoked (only once) when not joining an existing instance', function(assert) {
  assert.expect(1);

  function onError(error) {
    assert.equal('test error', error.message);
  }

  let bb = new Backburner(['errors'], {
    onError: onError
  });

  bb.join(() => {
    throw new Error('test error');
  });
});

QUnit.test('onError which does not rethrow is invoked (only once) when joining an existing instance', function(assert) {
  assert.expect(1);

  function onError(error) {
    assert.equal('test error', error.message);
  }

  let bb = new Backburner(['errors'], {
    onError: onError
  });

  bb.run(function() {
    bb.join(() => {
      throw new Error('test error');
    });
  });
});

QUnit.test('onError which does rethrow is invoked (only once) when not joining an existing instance', function(assert) {
  assert.expect(2);

  function onError(error) {
    assert.equal('test error', error.message);
    throw error;
  }

  let bb = new Backburner(['errors'], {
    onError: onError
  });

  assert.throws(() => {
    bb.join(() => {
      throw new Error('test error');
    });
  }, /test error/);
});

QUnit.test('onError which does rethrow is invoked (only once) when joining an existing instance', function(assert) {
  assert.expect(2);

  function onError(error) {
    assert.equal('test error', error.message);
    throw error;
  }

  let bb = new Backburner(['errors'], {
    onError: onError
  });

  assert.throws(() => {
    bb.run(function() {
      bb.join(() => {
        throw new Error('test error');
      });
    });
  }, /test error/);
});
