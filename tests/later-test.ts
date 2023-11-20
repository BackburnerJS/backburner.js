/* tslint:disable:no-shadowed-variable*/
import Backburner from 'backburner';
import lolex from 'lolex';

const originalDateNow = Date.now;
const originalDateValueOf = Date.prototype.valueOf;

let fakeClock;
QUnit.module('tests/set-timeout-test', {
  afterEach() {
    Date.now = originalDateNow;
    Date.prototype.valueOf = originalDateValueOf;
    if (fakeClock) {
      fakeClock.uninstall();
    }
  }
});

QUnit.test('later', function(assert) {
  assert.expect(6);

  let bb = new Backburner(['one']);
  let step = 0;
  let instance;
  let done = assert.async();

  // Force +new Date to return the same result while scheduling
  // run.later timers. Otherwise: non-determinism!
  let now = +new Date();
  Date.prototype.valueOf = function() { return now; };

  bb.later(null, () => {
    instance = bb.currentInstance;
    assert.equal(step++, 0);
  }, 10);

  bb.later(null, () => {
    assert.equal(step++, 1);
    assert.equal(instance, bb.currentInstance, 'same instance');
  }, 10);

  Date.prototype.valueOf = originalDateValueOf;
  // spin so that when we execute timers (+new Date()) will be greater than the
  // time scheduled above; not a problem in real life as we will never 'wait'
  // 0ms
  while ((+ new Date()) <= now + 10) {}

  bb.later(null, () => {
    assert.equal(step++, 2);

    bb.later(null, () => {
      assert.equal(step++, 3);
      assert.ok(true, 'Another later will execute correctly');
      done();
    }, 1);
  }, 20);
});

QUnit.test('debounce with later', function(assert) {
  assert.expect(3);
  let done = assert.async(2);
  let bb = new Backburner(['batman']);

  function debounceFunc(obj) {
    assert.notOk(obj.isFoo, 'debounce called with foo');
    assert.ok(obj.isBar, 'debounce called with bar');
    done();
  }

  function laterFunc() {
    assert.ok(true, 'later called');
    done();
  }

  const foo = { isFoo: true };
  const bar = { isBar: true };

  bb.debounce(debounceFunc, foo, 500);
  bb.later(laterFunc, 100);
  bb.debounce(debounceFunc, bar, 10);
});

QUnit.test('later should rely on stubbed `Date.now`', function(assert) {
  assert.expect(1);

  let bb = new Backburner(['one']);
  let done = assert.async();
  let globalNowWasUsed = false;

  Date.now = function() {
    globalNowWasUsed = true;
    return originalDateNow();
  };

  bb.later(() => {
    assert.ok(globalNowWasUsed);
    done();
  }, 1);
});

QUnit.test('later shedules timers correctly after time travel', function(assert) {
  assert.expect(2);

  let bb = new Backburner(['one']);
  let done = assert.async();
  let start = originalDateNow();
  let now = start;

  Date.now = () => now;

  let called1At = 0;
  let called2At = 0;

  bb.later(() => called1At = originalDateNow(), 1000);

  now += 1000;

  bb.later(() => called2At = originalDateNow(), 10);

  now += 10;

  setTimeout(() => {
    assert.ok(called1At !== 0, 'timeout 1 was called');
    assert.ok(called2At !== 0, 'timeout 2 was called');
    done();
  }, 20);
});

let bb;
QUnit.module('later arguments / arity', {
  beforeEach() {
    bb = new Backburner(['one']);
  },
  afterEach() {
    bb = undefined;
    if (fakeClock) {
      fakeClock.uninstall();
    }
  }
});

QUnit.test('[callback]', function(assert) {
  assert.expect(2);

  let done = assert.async();

  bb.later(function() {
    assert.equal(arguments.length, 0);
    assert.ok(true, 'was called');
    done();
  });
});

QUnit.test('[callback, undefined]', function(assert) {
  assert.expect(2);
  let done = assert.async();

  bb.later(function() {
    assert.equal(arguments.length, 1);
    assert.ok(true, 'was called');
    done();
  }, undefined);
});

QUnit.test('[null, callback, undefined]', function(assert) {
  assert.expect(2);
  let done = assert.async();

  bb.later(null, function() {
    assert.equal(arguments.length, 0);
    assert.ok(true, 'was called');
    done();
  });
});

QUnit.test('[null, callback, undefined]', function(assert) {
  assert.expect(2);
  let done = assert.async();

  bb.later(null, function() {
    assert.equal(arguments.length, 1);
    assert.ok(true, 'was called');
    done();
  }, undefined);
});

QUnit.test('[null, callback, null]', function(assert) {
  assert.expect(3);

  let done = assert.async();

  bb.later(null, function() {
    assert.equal(arguments.length, 1);
    assert.equal(arguments[0], null);
    assert.ok(true, 'was called');
    done();
  }, null);
});

QUnit.test('[callback, string, string, string]', function(assert) {
  assert.expect(5);

  let done = assert.async();

  bb.later(function() {
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

  bb.later(null, function() {
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
  bb.later(null, function() {
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
  bb.later(null, function() {
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
  bb.later({
    bro() {
      assert.ok(true, 'was called');
      done();
    }
  }, 'bro');
});

QUnit.test('[obj, string, value]', function(assert) {
  assert.expect(3);
  let done = assert.async();
  bb.later({
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
  bb.later({
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
  bb.later({
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

  bb.later(() => { throw new Error('test error'); }, 1);
});

QUnit.test('later doesn\'t trigger twice with earlier later', function(assert) {
  assert.expect(4);

  bb = new Backburner(['one']);
  let called1 = 0;
  let called2 = 0;
  let beginCalls = 0;
  let endCalls = 0;
  let oldBegin = bb.begin;
  let oldEnd = bb.end;
  let done = assert.async();

  bb.begin = function() {
    beginCalls++;
    oldBegin.call(bb);
  };

  bb.end = function() {
    endCalls++;
    oldEnd.call(bb);
  };

  bb.later(() => called1++, 50);
  bb.later(() => called2++, 10);

  setTimeout(() => {
    assert.equal(called1, 1, 'timeout 1 was called once');
    assert.equal(called2, 1, 'timeout 2 was called once');
    assert.equal(beginCalls, 2, 'begin() was called twice');
    assert.equal(endCalls, 2, 'end() was called twice');
    done();
  }, 100);
});

QUnit.test('later with two Backburner instances', function(assert) {
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

  bb1.later(() => assert.equal(++steps, 5), 10);

  assert.equal(++steps, 2);

  bb2.later(() => assert.equal(++steps, 7), 10);

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

  bb.later(() => called1At = Date.now(), 1);

  // Block JS to simulate https://github.com/ebryn/backburner.js/issues/135
  let waitUntil = Date.now() + 5;
  while (Date.now() < waitUntil) { }

  bb.later(() => called2At = Date.now(), 50);

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

  bb.later(() => called1At = Date.now(), 1);
  bb.later(() => {}, NaN);
  bb.later(() => called2At = Date.now(), 10);

  setTimeout(() => {
    assert.ok(called1At !== 0, 'timeout 1 was called');
    assert.ok(called2At !== 0, 'timeout 2 was called');
    done();
  }, 20);
});

QUnit.test('when [callback, string] args passed', function(assert) {
  assert.expect(1);
  let done = assert.async();

  let bb = new Backburner(['one']);

  bb.later(function(name) {
    assert.equal(name, 'batman');
    done();
  }, 'batman', 0);
});

QUnit.test('can be ran "early" with fake timers GH#351', function(assert) {
  assert.expect(1);
  let done = assert.async();

  let bb = new Backburner(['one']);

  fakeClock = lolex.install();

  let startTime = originalDateNow();
  bb.later(function(name) {
    let endTime = originalDateNow();
    assert.ok(endTime - startTime < 100, 'did not wait for 5s to run timer');
    done();
  }, 5000);

  fakeClock.tick(5001);
});

QUnit.test('debounce called before later', function(assert) {
  assert.expect(1);

  let done = assert.async(1);
  let bb = new Backburner(['one']);
  let func = function() {};

  bb.run(() => {
    bb.debounce(func, 1000);
    setTimeout(function() {
      bb.debounce(func, 1000);
    }, 50);

    let before = Date.now();

    bb.later(function() {
      let diff = Date.now() - before;
      assert.ok(diff < 1010, '.later called with too much delay');
      done();
    }, 1000);
  });

 });

QUnit.test('boundRunExpiredTimers is called once when first timer canceled', function(assert) {
  let done = assert.async(1);

  let bb = new Backburner(['one']);

  let timer = bb.later(function() {}, 500);
  bb.cancel(timer);

  let boundRunExpiredTimers = bb['_boundRunExpiredTimers'];
  bb['_boundRunExpiredTimers'] = function() {
    assert.ok(true);
    done();
    return boundRunExpiredTimers.apply(bb, arguments);
  };

  bb.later(function() {}, 800);
});
