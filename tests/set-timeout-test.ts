import Backburner from 'backburner';

const originalDateNow = Date.now;
const originalDateValueOf = Date.prototype.valueOf;

QUnit.module('tests/set-timeout-test', {
  afterEach() {
    Date.now = originalDateNow;
    Date.prototype.valueOf = originalDateValueOf;
  }
});

QUnit.test('setTimeout', function(assert) {
  assert.expect(6);

  let bb = new Backburner(['one']);
  let step = 0;
  let instance;
  let done = assert.async();

  // Force +new Date to return the same result while scheduling
  // run.later timers. Otherwise: non-determinism!
  let now = +new Date();
  Date.prototype.valueOf = function() { return now; };

  bb.setTimeout(null, () => {
    instance = bb.currentInstance;
    assert.equal(step++, 0);
  }, 10);

  bb.setTimeout(null, () => {
    assert.equal(step++, 1);
    assert.equal(instance, bb.currentInstance, 'same instance');
  }, 10);

  Date.prototype.valueOf = originalDateValueOf;
  // spin so that when we execute timers (+new Date()) will be greater than the
  // time scheduled above; not a problem in real life as we will never 'wait'
  // 0ms
  while ((+ new Date()) <= now + 10) {};

  bb.setTimeout(null, () => {
    assert.equal(step++, 2);

    bb.setTimeout(null, () => {
      assert.equal(step++, 3);
      assert.ok(true, 'Another later will execute correctly');
      done();
    }, 1);
  }, 20);
});

QUnit.test('setTimeout can continue when `Date.now` is monkey-patched', function(assert) {
  assert.expect(1);

  let arbitraryTime = +new Date();
  let bb = new Backburner(['one']);
  let done = assert.async();

  Date.now = function() { return arbitraryTime; };

  bb.setTimeout(() => {
    assert.ok(true);
    done();
  }, 1);
});

let bb;
QUnit.module('setTimeout arguments / arity', {
  beforeEach() {
    bb = new Backburner(['one']);
  },
  afterEach() {
    bb = undefined;
  }
});

QUnit.test('[callback]', function(assert) {
  assert.expect(2);

  let done = assert.async();

  bb.setTimeout(function() {
    assert.equal(arguments.length, 0);
    assert.ok(true, 'was called');
    done();
  });
});

QUnit.test('[callback, undefined]', function(assert) {
  assert.expect(2);
  let done = assert.async();

  bb.setTimeout(function() {
    assert.equal(arguments.length, 1);
    assert.ok(true, 'was called');
    done();
  }, undefined);
});

QUnit.test('[null, callback, undefined]', function(assert) {
  assert.expect(2);
  let done = assert.async();

  bb.setTimeout(null, function() {
    assert.equal(arguments.length, 0);
    assert.ok(true, 'was called');
    done();
  });
});

QUnit.test('[null, callback, undefined]', function(assert) {
  assert.expect(2);
  let done = assert.async();

  bb.setTimeout(null, function() {
    assert.equal(arguments.length, 1);
    assert.ok(true, 'was called');
    done();
  }, undefined);
});

QUnit.test('[null, callback, null]', function(assert) {
  assert.expect(3);

  let done = assert.async();

  bb.setTimeout(null, function() {
    assert.equal(arguments.length, 1);
    assert.equal(arguments[0], null);
    assert.ok(true, 'was called');
    done();
  }, null);
});

QUnit.test('[callback, string, string, string]', function(assert) {
  assert.expect(5);

  let done = assert.async();

  bb.setTimeout(function() {
    assert.equal(arguments.length, 3);
    assert.equal(arguments[0], 'a');
    assert.equal(arguments[1], 'b');
    assert.equal(arguments[2], 'c');
    assert.ok(true, 'was called');
    done();
  }, 'a', 'b', 'c');
});

QUnit.test('[null, callback, string, string, string]', function(assert) {
  assert.expect(5);

  let done = assert.async();

  bb.setTimeout(null, function() {
    assert.equal(arguments.length, 3);
    assert.equal(arguments[0], 'a');
    assert.equal(arguments[1], 'b');
    assert.equal(arguments[2], 'c');
    assert.ok(true, 'was called');
    done();
  }, 'a', 'b', 'c');
});

QUnit.test('[null, callback, string, string, string, number]', function(assert) {
  assert.expect(5);
  let done = assert.async();
  bb.setTimeout(null, function() {
    assert.equal(arguments.length, 3);
    assert.equal(arguments[0], 'a');
    assert.equal(arguments[1], 'b');
    assert.equal(arguments[2], 'c');
    assert.ok(true, 'was called');
    done();
  }, 'a', 'b', 'c', 10);
});

QUnit.test('[null, callback, string, string, string, numericString]', function(assert) {
  assert.expect(5);
  let done = assert.async();
  bb.setTimeout(null, function() {
    assert.equal(arguments.length, 3);
    assert.equal(arguments[0], 'a');
    assert.equal(arguments[1], 'b');
    assert.equal(arguments[2], 'c');
    assert.ok(true, 'was called');
    done();
  },  'a', 'b', 'c', '1');
});

QUnit.test('[obj, string]', function(assert) {
  assert.expect(1);
  let done = assert.async();
  bb.setTimeout({
    bro() {
      assert.ok(true, 'was called');
      done();
    }
  }, 'bro');
});

QUnit.test('[obj, string, value]', function(assert) {
  assert.expect(3);
  let done = assert.async();
  bb.setTimeout({
    bro() {
      assert.equal(arguments.length, 1);
      assert.equal(arguments[0], 'value');
      assert.ok(true, 'was called');
      done();
    }
  }, 'bro', 'value');
});

QUnit.test('[obj, string, value, number]', function(assert) {
  let done = assert.async();
  bb.setTimeout({
    bro() {
      assert.equal(arguments.length, 1);
      assert.equal(arguments[0], 'value');
      assert.ok(true, 'was called');
      done();
    }
  }, 'bro', 'value', 1);
});

QUnit.test('[obj, string, value, numericString]', function(assert) {
  let done = assert.async();
  bb.setTimeout({
    bro() {
      assert.equal(arguments.length, 1);
      assert.equal(arguments[0], 'value');
      assert.ok(true, 'was called');
      done();
    }
  }, 'bro', 'value', '1');
});

QUnit.test('onError', function(assert) {
  assert.expect(1);

  let done = assert.async();

  function onError(error) {
    assert.equal('test error', error.message);
    done();
  }

  bb = new Backburner(['errors'], { onError });

  bb.setTimeout(() => { throw new Error('test error'); }, 1);
});

QUnit.test('setTimeout doesn\'t trigger twice with earlier setTimeout', function(assert) {
  assert.expect(3);

  bb = new Backburner(['one']);
  let called1 = 0;
  let called2 = 0;
  let calls = 0;
  let oldRun = bb.run;
  let done = assert.async();

  // Count run() calls and relay them to original function
  bb.run = function () {
    calls++;
    oldRun.apply(bb, arguments);
  };

  bb.setTimeout(() => called1++, 50);
  bb.setTimeout(() => called2++, 10);

  setTimeout(() => {
    assert.equal(called1, 1, 'timeout 1 was called once');
    assert.equal(called2, 1, 'timeout 2 was called once');
    assert.equal(calls, 2, 'run() was called twice');
    done();
  }, 100);
});

QUnit.test('setTimeout with two Backburner instances', function(assert) {
  assert.expect(8);

  let steps = 0;
  let done = assert.async();
  let bb1 = new Backburner(['one'], {
    onBegin() {
      assert.equal(++steps, 4);
    }
  });
  let bb2 = new Backburner(['one'], {
    onBegin() {
      assert.equal(++steps, 6);
    }
  });

  assert.equal(++steps, 1);

  bb1.setTimeout(() => assert.equal(++steps, 5), 10);

  assert.equal(++steps, 2);

  bb2.setTimeout(() => assert.equal(++steps, 7), 10);

  assert.equal(++steps, 3);

  setTimeout(() => {
    assert.equal(++steps, 8);
    done();
  }, 50);
});

QUnit.test('expired timeout doesn\'t hang when setting a new timeout', function(assert) {
  assert.expect(3);

  let called1At = 0;
  let called2At = 0;
  let done = assert.async();

  bb.setTimeout(() => called1At = Date.now(), 1);

  // Block JS to simulate https://github.com/ebryn/backburner.js/issues/135
  let waitUntil = Date.now() + 5;
  while (Date.now() < waitUntil) { }

  bb.setTimeout(() => called2At = Date.now(), 50);

  setTimeout(() => {
    assert.ok(called1At !== 0, 'timeout 1 was called');
    assert.ok(called2At !== 0, 'timeout 2 was called');
    assert.ok(called2At - called1At > 10, 'timeout 1 did not wait for timeout 2');
    done();
  }, 60);
});

QUnit.test('NaN timeout doesn\'t hang other timeouts', function(assert) {
  assert.expect(2);

  let done = assert.async();
  let called1At = 0;
  let called2At = 0;

  bb.setTimeout(() => called1At = Date.now(), 1);
  bb.setTimeout(() => {}, NaN);
  bb.setTimeout(() => called2At = Date.now(), 10);

  setTimeout(() => {
    assert.ok(called1At !== 0, 'timeout 1 was called');
    assert.ok(called2At !== 0, 'timeout 2 was called');
    done();
  }, 20);
});
