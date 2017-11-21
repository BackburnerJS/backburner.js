import Backburner from 'backburner';

QUnit.module('tests/throttle');

QUnit.test('throttle', function(assert) {
  assert.expect(18);

  let bb = new Backburner(['zomg']);
  let step = 0;
  let done = assert.async();

  let wasCalled = false;
  function throttler() {
    assert.ok(!wasCalled);
    wasCalled = true;
  }

  // let's throttle the function `throttler` for 40ms
  // it will be executed in 40ms
  bb.throttle(null, throttler, 40, false);
  assert.equal(step++, 0);

  // let's schedule `throttler` to run in 10ms
  setTimeout(() => {
    assert.equal(step++, 1);
    assert.ok(!wasCalled);
    bb.throttle(null, throttler, false);
  }, 10);

  // let's schedule `throttler` to run again in 20ms
  setTimeout(() => {
    assert.equal(step++, 2);
    assert.ok(!wasCalled);
    bb.throttle(null, throttler, false);
  }, 20);

  // let's schedule `throttler` to run yet again in 30ms
  setTimeout(() => {
    assert.equal(step++, 3);
    assert.ok(!wasCalled);
    bb.throttle(null, throttler, false);
  }, 30);

  // at 40ms, `throttler` will get called once

  // now, let's schedule an assertion to occur at 50ms,
  // 10ms after `throttler` has been called
  setTimeout(() => {
    assert.equal(step++, 4);
    assert.ok(wasCalled);
  }, 50);

  // great, we've made it this far, there's one more thing
  // we need to test. we want to make sure we can call `throttle`
  // again with the same target/method after it has executed
  // at the 60ms mark, let's schedule another call to `throttle`
  setTimeout(() => {
    wasCalled = false; // reset the flag

    // assert call order
    assert.equal(step++, 5);

    // call throttle for the second time
    bb.throttle(null, throttler, 100, false);

    // assert that it is called in the future and not blackholed
    setTimeout(() => {
      assert.equal(step++, 6);
      assert.ok(wasCalled, 'Another throttle call with the same function can be executed later');
    }, 110);
  }, 60);

  setTimeout(() => {
    wasCalled = false; // reset the flag

    // assert call order
    assert.equal(step++, 7);

    // call throttle again that time using a string number like time interval
    bb.throttle(null, throttler, '100', false);

    // assert that it is called in the future and not blackholed
    setTimeout(() => {
      assert.equal(step++, 8);
      assert.ok(wasCalled, 'Throttle accept a string number like time interval');
      done();
    }, 110);
  }, 180);
});

QUnit.test('throttle with cancelTimers', function(assert) {
  assert.expect(1);

  let count = 0;
  let bb = new Backburner(['zomg']);

  // Throttle a no-op 10ms
  bb.throttle(null, () => { /* no-op */ }, 10, false);

  try {
    bb.cancelTimers();
  } catch (e) {
    count++;
  }

  assert.equal(count, 0, 'calling cancelTimers while something is being throttled does not throw an error');
});

QUnit.test('throttled function is called with final argument', function(assert) {
  assert.expect(1);
  let done = assert.async();

  let count = 0;
  let bb = new Backburner(['zomg']);

  function throttled(arg) {
    assert.equal(arg, 'bus');
    done();
  }

  bb.throttle(null, throttled, 'car' , 10, false);
  bb.throttle(null, throttled, 'bicycle' , 10, false);
  bb.throttle(null, throttled, 'bus' , 10, false);
});

QUnit.test('throttle returns same timer', function(assert) {
  assert.expect(2);

  let bb = new Backburner(['joker']);

  function throttled1() {}
  function throttled2() {}

  let timer1 = bb.throttle(null, throttled1, 10);
  let timer2 = bb.throttle(null, throttled2, 10);
  let timer3 = bb.throttle(null, throttled1, 10);
  let timer4 = bb.throttle(null, throttled2, 10);

  assert.equal(timer1, timer3);
  assert.equal(timer2, timer4);
});

QUnit.test('throttle leading edge', function(assert) {
  assert.expect(10);

  let bb = new Backburner(['zerg']);
  let throttle;
  let throttle2;
  let wasCalled = false;
  let done = assert.async();

  function throttler() {
    assert.ok(!wasCalled, 'throttler hasn\'t been called yet');
    wasCalled = true;
  }

  // let's throttle the function `throttler` for 40ms
  // it will be executed immediately, but throttled for the future hits
  throttle = bb.throttle(null, throttler, 40);

  assert.ok(wasCalled, 'function was executed immediately');

  wasCalled = false;
  // let's schedule `throttler` to run again, it shouldn't be allowed to queue for another 40 msec
  throttle2 = bb.throttle(null, throttler, 40);

  assert.equal(throttle, throttle2, 'No new throttle was inserted, returns old throttle');

  setTimeout(() => {
    assert.ok(!wasCalled, 'attempt to call throttle again didn\'t happen');

    throttle = bb.throttle(null, throttler, 40);
    assert.ok(wasCalled, 'newly inserted throttle after timeout functioned');

    assert.ok(bb.cancel(throttle), 'wait time of throttle was cancelled');

    wasCalled = false;
    throttle2 = bb.throttle(null, throttler, 40);
    assert.notEqual(throttle, throttle2, 'the throttle is different');
    assert.ok(wasCalled, 'throttle was inserted and run immediately after cancel');
    done();
  }, 60);
});

QUnit.test('throttle returns timer information usable for cancelling', function(assert) {
  assert.expect(3);

  let done = assert.async();
  let bb = new Backburner(['batman']);
  let wasCalled = false;

  function throttler() {
    assert.ok(false, 'this method shouldn\'t be called');
    wasCalled = true;
  }

  let timer = bb.throttle(null, throttler, 1, false);

  assert.ok(bb.cancel(timer), 'the timer is cancelled');

  // should return false second time around
  assert.ok(!bb.cancel(timer), 'the timer no longer exists in the list');

  setTimeout(() => {
    assert.ok(!wasCalled, 'the timer wasn\'t called after waiting');
    done();
  }, 60);
});

QUnit.test('throttler cancel after it\'s executed returns false', function(assert) {
  assert.expect(3);

  let bb = new Backburner(['darkknight']);
  let done = assert.async();

  let wasCalled = false;

  function throttler() {
    assert.ok(true, 'the throttled method was called');
    wasCalled = true;
  }

  let timer = bb.throttle(null, throttler, 1);

  setTimeout(() => {
    assert.ok(!bb.cancel(timer), 'no timer existed to cancel');
    assert.ok(wasCalled, 'the timer was actually called');
    done();
  }, 10);
});

QUnit.test('throttler returns the appropriate timer to cancel if the old item still exists', function(assert) {
  assert.expect(5);

  let bb = new Backburner(['robin']);
  let wasCalled = false;
  let done = assert.async();

  function throttler() {
    assert.ok(true, 'the throttled method was called');
    wasCalled = true;
  }

  let timer = bb.throttle(null, throttler, 1);
  let timer2 = bb.throttle(null, throttler, 1);

  assert.deepEqual(timer, timer2, 'the same timer was returned');

  setTimeout(() => {
    bb.throttle(null, throttler, 1);
    assert.ok(!bb.cancel(timer), 'the second timer isn\'t removed, despite appearing to be the same item');
    assert.ok(wasCalled, 'the timer was actually called');
    done();
  }, 10);

});

QUnit.test('onError', function(assert) {
  assert.expect(1);

  function onError(error) {
    assert.equal('test error', error.message);
  }

  let bb = new Backburner(['errors'], {
    onError: onError
  });

  bb.throttle(null, () => {
    throw new Error('test error');
  }, 20);
});

QUnit.test('throttle + immediate joins existing run loop instances', function(assert) {
  assert.expect(1);

  function onError(error) {
    throw error;
  }

  let bb = new Backburner(['errors'], {
    onError: onError
  });

  bb.run(() => {
    let parentInstance = bb.currentInstance;
    bb.throttle(null, () => {
      assert.equal(bb.currentInstance, parentInstance);
    }, 20, true);
  });
});
