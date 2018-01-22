import Backburner from 'backburner';

QUnit.module('tests/debounce');

QUnit.test('debounce', function(assert) {
  assert.expect(14);

  let bb = new Backburner(['zomg']);
  let step = 0;
  let done = assert.async();

  let wasCalled = false;
  function debouncee() {
    assert.ok(!wasCalled);
    wasCalled = true;
  }

  // let's debounce the function `debouncee` for 40ms
  // it will be executed 40ms after
  bb.debounce(null, debouncee, 40);
  assert.equal(step++, 0);

  // let's schedule `debouncee` to run in 10ms
  setTimeout(() => {
    assert.equal(step++, 1);
    assert.ok(!wasCalled);
    bb.debounce(null, debouncee, 40);
  }, 10);

  // let's schedule `debouncee` to run again in 30ms
  setTimeout(() => {
    assert.equal(step++, 2);
    assert.ok(!wasCalled);
    bb.debounce(null, debouncee, 40);
  }, 30);

  // let's schedule `debouncee` to run yet again in 60ms
  setTimeout(() => {
    assert.equal(step++, 3);
    assert.ok(!wasCalled);
    bb.debounce(null, debouncee, 40);
  }, 60);

  // now, let's schedule an assertion to occur at 110ms,
  // 10ms after `debouncee` has been called the last time
  setTimeout(() => {
    assert.equal(step++, 4);
    assert.ok(wasCalled);
  }, 110);

  // great, we've made it this far, there's one more thing
  // we need to QUnit.test. we want to make sure we can call `debounce`
  // again with the same target/method after it has executed

  // at the 120ms mark, let's schedule another call to `debounce`
  setTimeout(() => {
    wasCalled = false; // reset the flag

    // assert call order
    assert.equal(step++, 5);

    // call debounce for the second time
    bb.debounce(null, debouncee, 100);

    // assert that it is called in the future and not blackholed
    setTimeout(() => {
      assert.equal(step++, 6);
      assert.ok(wasCalled, 'Another debounce call with the same function can be executed later');
      done();
    }, 230);
  }, 120);
});

QUnit.test('debounce - immediate', function(assert) {
  assert.expect(16);

  let done = assert.async();
  let bb = new Backburner(['zomg']);
  let step = 0;

  let wasCalled = false;
  function debouncee() {
    assert.ok(!wasCalled);
    wasCalled = true;
  }

  // let's debounce the function `debouncee` for 40ms
  // it will be executed immediately, and prevent
  // any actions for 40ms after
  bb.debounce(null, debouncee, 40, true);
  assert.equal(step++, 0);
  assert.ok(wasCalled);
  wasCalled = false;

  // let's schedule `debouncee` to run in 10ms
  setTimeout(() => {
    assert.equal(step++, 1);
    assert.ok(!wasCalled);
    bb.debounce(null, debouncee, 40, true);
  }, 10);

  // let's schedule `debouncee` to run again in 30ms
  setTimeout(() => {
    assert.equal(step++, 2);
    assert.ok(!wasCalled);
    bb.debounce(null, debouncee, 40, true);
  }, 30);

  // let's schedule `debouncee` to run yet again in 60ms
  setTimeout(() => {
    assert.equal(step++, 3);
    assert.ok(!wasCalled);
    bb.debounce(null, debouncee, 40, true);
  }, 60);

  // now, let's schedule an assertion to occur at 110ms,
  // 10ms after `debouncee` has been called the last time
  setTimeout(() => {
    assert.equal(step++, 4);
    assert.ok(!wasCalled);
  }, 110);

  // great, we've made it this far, there's one more thing
  // we need to QUnit.test. we want to make sure we can call `debounce`
  // again with the same target/method after it has executed

  // at the 120ms mark, let's schedule another call to `debounce`
  setTimeout(() => {
    wasCalled = false; // reset the flag

    // assert call order
    assert.equal(step++, 5);

    // call debounce for the second time
    bb.debounce(null, debouncee, 100, true);
    assert.ok(wasCalled, 'Another debounce call with the same function can be executed later');
    wasCalled = false;

    // assert that it is called in the future and not blackholed
    setTimeout(() => {
      assert.equal(step++, 6);
      assert.ok(!wasCalled);
      done();
    }, 230);
  }, 120);
});

QUnit.test('debounce + immediate joins existing run loop instances', function(assert) {
  assert.expect(1);

  function onError(error) {
    throw error;
  }

  let bb = new Backburner(['errors'], {
    onError: onError
  });

  bb.run(() => {
    let parentInstance = bb.currentInstance;
    bb.debounce(null, () => {
      assert.equal(bb.currentInstance, parentInstance);
    }, 20, true);
  });
});

QUnit.test('debounce accept time interval like string numbers', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['zomg']);
  let step = 0;
  let wasCalled = false;

  function debouncee() {
    assert.ok(!wasCalled);
    wasCalled = true;
  }

  bb.debounce(null, debouncee, '40');
  assert.equal(step++, 0);

  setTimeout(() => {
    assert.equal(step++, 1);
    assert.ok(!wasCalled);
    bb.debounce(null, debouncee, '40');
  }, 10);

  setTimeout(() => {
    assert.equal(step++, 2);
    assert.ok(wasCalled);
    done();
  }, 60);
});

QUnit.test('debounce returns timer information usable for canceling', function(assert) {
  assert.expect(3);

  let done = assert.async();
  let bb = new Backburner(['batman']);
  let wasCalled = false;

  function debouncee() {
    assert.ok(false, 'this method shouldn\'t be called');
    wasCalled = true;
  }

  let timer = bb.debounce(null, debouncee, 1);

  assert.ok(bb.cancel(timer), 'the timer is cancelled');

  // should return false second time around
  assert.ok(!bb.cancel(timer), 'the timer no longer exists in the list');

  setTimeout(() => {
    assert.ok(!wasCalled, 'the timer wasn\'t called after waiting');
    done();
  }, 60);
});

QUnit.test('debounce cancelled after it\'s executed returns false', function(assert) {
  assert.expect(3);

  let done = assert.async();
  let bb = new Backburner(['darkknight']);
  let wasCalled = false;

  function debouncee() {
    assert.ok(true, 'the debounced method was called');
    wasCalled = true;
  }

  let timer = bb.debounce(null, debouncee, 1);

  setTimeout(() => {
    assert.ok(!bb.cancel(timer), 'no timer existed to cancel');
    assert.ok(wasCalled, 'the timer was actually called');
    done();
  }, 10);

});

QUnit.test('debounced function is called with final argument', function(assert) {
  assert.expect(1);

  let done = assert.async();
  let bb = new Backburner(['joker']);

  function debouncee(arg) {
    assert.equal('bus', arg, 'the debounced is called with right argument');
    done();
  }

  bb.debounce(null, debouncee, 'car', 10);
  bb.debounce(null, debouncee, 'bicycle', 10);
  bb.debounce(null, debouncee, 'bus', 10);
});

QUnit.test('debounce cancelled doesn\'t cancel older items', function(assert) {
  assert.expect(4);

  let bb = new Backburner(['robin']);
  let wasCalled = false;
  let done = assert.async();

  function debouncee() {
    assert.ok(true, 'the debounced method was called');
    if (wasCalled) {
      done();
    }
    wasCalled = true;
  }

  let timer = bb.debounce(null, debouncee, 1);

  setTimeout(() => {
    bb.debounce(null, debouncee, 1);
    assert.ok(!bb.cancel(timer), 'the second timer isn\'t removed, despite appearing to be the same');
    assert.ok(wasCalled, 'the timer was actually called');
  }, 10);
});

QUnit.test('debounce that is immediate, and cancelled and called again happens immediately', function(assert) {
  assert.expect(3);

  let done = assert.async();
  let bb = new Backburner(['robin']);
  let calledCount = 0;

  function debouncee() {
    calledCount++;
  }

  let timer = bb.debounce(null, debouncee, 1000, true);

  setTimeout(() => { // 10 millisecond delay
    assert.equal(1, calledCount, 'debounced method was called');
    assert.ok(bb.cancel(timer), 'debounced delay was cancelled');
    bb.debounce(null, debouncee, 1000, true);

    setTimeout(() => { // 10 millisecond delay
      assert.equal(2, calledCount, 'debounced method was called again immediately');
      done();
    }, 10);
  }, 10);

});

QUnit.test('debounce without a target, without args', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['batman']);
  let calledCount = 0;
  let calledWith = new Array();
  function debouncee(...args) {
    calledCount++;
    calledWith.push(args);
  }

  bb.debounce(debouncee, 10);
  bb.debounce(debouncee, 10);
  bb.debounce(debouncee, 10);
  assert.equal(calledCount, 0, 'debounced method was not called immediately');

  setTimeout(() => {
    assert.equal(calledCount, 0, 'debounced method was not called on next tick');
  }, 0);

  setTimeout(() => {
    assert.equal(calledCount, 1, 'debounced method was was only called once');
    assert.deepEqual(calledWith, [ [] ], 'debounce called once without arguments');
    done();
  }, 20);
});

QUnit.test('debounce without a target, without args - can be canceled', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['batman']);
  let calledCount = 0;
  function debouncee() {
    calledCount++;
  }

  bb.debounce(debouncee, 10);
  bb.debounce(debouncee, 10);
  let timer = bb.debounce(debouncee, 10);
  assert.equal(calledCount, 0, 'debounced method was not called immediately');

  setTimeout(() => {
    bb.cancel(timer);
    assert.equal(calledCount, 0, 'debounced method was not called on next tick');
  }, 0);

  setTimeout(() => {
    assert.equal(calledCount, 0, 'debounced method was canceled properly');
    done();
  }, 20);
});

QUnit.test('debounce without a target, without args, immediate', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['batman']);
  let calledCount = 0;
  let calledWith = new Array();
  function debouncee(...args) {
    calledCount++;
    calledWith.push(args);
  }

  bb.debounce(debouncee, 10, true);
  bb.debounce(debouncee, 10, true);
  bb.debounce(debouncee, 10, true);
  assert.equal(calledCount, 1, 'debounced method was called immediately');
  assert.deepEqual(calledWith, [ [] ], 'debounce method was called with the correct arguments');

  setTimeout(() => {
    bb.debounce(debouncee, 10, true);
    assert.equal(calledCount, 1, 'debounced method was not called again within the time window');
  }, 0);

  setTimeout(() => {
    assert.equal(calledCount, 1, 'debounced method was was only called once');
    done();
  }, 20);
});

QUnit.test('debounce without a target, without args, immediate - can be canceled', function(assert) {
  let bb = new Backburner(['batman']);

  let fooCalledCount = 0;
  let barCalledCount = 0;
  function foo() {
    fooCalledCount++;
  }
  function bar() {
    barCalledCount++;
  }

  bb.debounce(foo, 10, true);
  bb.debounce(foo, 10, true);
  assert.equal(fooCalledCount, 1, 'foo was called immediately, then debounced');

  bb.debounce(bar, 10, true);
  let timer = bb.debounce(bar, 10, true);
  assert.equal(barCalledCount, 1, 'bar was called immediately, then debounced');

  bb.cancel(timer);
  bb.debounce(bar, 10, true);
  assert.equal(barCalledCount, 2, 'after canceling the prior debounce, bar was called again');
});

QUnit.test('debounce without a target, with args', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['batman']);
  let calledCount = 0;
  let calledWith: string[] = [];
  function debouncee(first) {
    calledCount++;
    calledWith.push(first);
  }

  let foo = { isFoo: true };
  let bar = { isBar: true };
  let baz = { isBaz: true };
  bb.debounce(debouncee, foo, 10);
  bb.debounce(debouncee, bar, 10);
  bb.debounce(debouncee, baz, 10);
  assert.equal(calledCount, 0, 'debounced method was not called immediately');

  setTimeout(() => {
    assert.deepEqual(calledWith, [{ isBaz: true }], 'debounce method was only called once, with correct argument');
    done();
  }, 20);
});

QUnit.test('debounce without a target, with args - can be canceled', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['batman']);
  let calledCount = 0;
  let calledWith: string[] = [];
  function debouncee(first) {
    calledCount++;
    calledWith.push(first);
  }

  let foo = { isFoo: true };
  let bar = { isBar: true };
  let baz = { isBaz: true };
  bb.debounce(debouncee, foo, 10);
  bb.debounce(debouncee, bar, 10);
  let timer = bb.debounce(debouncee, baz, 10);
  assert.equal(calledCount, 0, 'debounced method was not called immediately');

  setTimeout(() => {
    assert.deepEqual(calledWith, [], 'debounce method has not been called on next tick');
    bb.cancel(timer);
  }, 0);

  setTimeout(() => {
    assert.deepEqual(calledWith, [], 'debounce method is not called when canceled');
    done();
  }, 20);
});

QUnit.test('debounce without a target, with args, immediate', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['batman']);
  let calledCount = 0;
  let calledWith = new Array();
  function debouncee(first) {
    calledCount++;
    calledWith.push(first);
  }

  let foo = { isFoo: true };
  let bar = { isBar: true };
  let baz = { isBaz: true };
  let qux = { isQux: true };
  bb.debounce(debouncee, foo, 10, true);
  bb.debounce(debouncee, bar, 10, true);
  bb.debounce(debouncee, baz, 10, true);

  assert.deepEqual(calledWith, [{ isFoo: true }], 'debounce method was only called once, with correct argument');

  setTimeout(() => {
    bb.debounce(debouncee, qux, 10, true);
    assert.deepEqual(calledWith, [{ isFoo: true }], 'debounce method was only called once, with correct argument');
  }, 0);

  setTimeout(() => {
    assert.deepEqual(calledWith, [{ isFoo: true }], 'debounce method was only called once, with correct argument');
    done();
  }, 20);
});

QUnit.test('debounce without a target, with args, immediate - can be canceled', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['batman']);
  let calledCount = 0;
  let calledWith: string[] = [];
  function debouncee(first) {
    calledCount++;
    calledWith.push(first);
  }

  let foo = { isFoo: true };
  let bar = { isBar: true };
  let baz = { isBaz: true };
  let qux = { isQux: true };
  bb.debounce(debouncee, foo, 10, true);
  bb.debounce(debouncee, bar, 10, true);
  let timer = bb.debounce(debouncee, baz, 10, true);

  assert.deepEqual(calledWith, [{ isFoo: true }], 'debounce method was only called once, with correct argument');

  setTimeout(() => {
    bb.cancel(timer);
    bb.debounce(debouncee, qux, 10, true);
    assert.deepEqual(calledWith, [{ isFoo: true }, { isQux: true }], 'debounce method was called again after canceling prior timer');
  }, 0);

  setTimeout(() => {
    assert.deepEqual(calledWith, [{ isFoo: true }, { isQux: true }], 'debounce method was not called again');
    done();
  }, 20);
});

QUnit.test('onError', function(assert) {
  assert.expect(1);

  let done = assert.async();

  function onError(error) {
    assert.equal('QUnit.test error', error.message);
    done();
  }

  let bb = new Backburner(['errors'], {
    onError
  });

  bb.debounce(null, () => { throw new Error('QUnit.test error'); }, 20);
});

QUnit.test('debounce within a debounce can be canceled GH#183', function(assert) {
  assert.expect(3);

  let done = assert.async();
  let bb = new Backburner(['zomg']);

  let foo = () => {
    assert.ok(true, 'foo called');
    return bb.debounce(bar, 10);
  };

  let bar = () => {
    assert.ok(true, 'bar called');
    let timer = foo();
    bb.cancel(timer);

    setTimeout(done, 10);
  };

  foo();
});
