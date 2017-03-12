
import Backburner from 'backburner';

QUnit.module('tests/cancel');

QUnit.test('null', function(assert) {
  // mimic browser behavior: window.clearTimeout(null) -> undefined
  assert.expect(3);
  let bb = new Backburner(['cancel']);
  assert.equal(bb.cancel(), undefined, 'cancel with no arguments should return undefined');
  assert.equal(bb.cancel(null), undefined, 'cancel a null timer should return undefined');
  assert.equal(bb.cancel(undefined), undefined, 'cancel an undefined timer should return undefined');
});

QUnit.test('deferOnce', function(assert) {
  assert.expect(3);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    let timer = bb.deferOnce('one', () => functionWasCalled = true);

    assert.ok(timer, 'Timer object was returned');
    assert.ok(bb.cancel(timer), 'Cancel returned true');
    assert.ok(!functionWasCalled, 'function was not called');
  });
});

QUnit.test('setTimeout', function(assert) {
  assert.expect(5);
  let done = assert.async();

  let called = false;
  let bb = new Backburner(['one'], {
    onBegin() {
      called = true;
    }
  });

  let functionWasCalled = false;
  let timer = bb.setTimeout(() => functionWasCalled = true);

  assert.ok(timer, 'Timer object was returned');
  assert.ok(bb.cancel(timer), 'Cancel returned true');
  assert.ok(!called, 'onBegin was not called');

  setTimeout(() => {
    assert.ok(!functionWasCalled, 'function was not called');
    assert.ok(!called, 'onBegin was not called');
    done();
  }, 0);
});

QUnit.test('setTimeout with multiple pending', function(assert) {
  assert.expect(7);

  let done = assert.async();
  let called = false;
  let bb = new Backburner(['one'], {
    onBegin() {
      called = true;
    }
  });
  let function1WasCalled = false;
  let function2WasCalled = false;

  let timer1 = bb.setTimeout(() => function1WasCalled = true);
  let timer2 = bb.setTimeout(() => function2WasCalled = true);

  assert.ok(timer1, 'Timer object 2 was returned');
  assert.ok(bb.cancel(timer1), 'Cancel for timer 1 returned true');
  assert.ok(timer2, 'Timer object 2 was returned');
  assert.ok(!called, 'onBegin was not called');

  setTimeout(() => {
    assert.ok(!function1WasCalled, 'function 1 was not called');
    assert.ok(function2WasCalled, 'function 2 was called');
    assert.ok(called, 'onBegin was called');

    done();
  }, 10);
});

QUnit.test('setTimeout and creating a new setTimeout', function(assert) {
  assert.expect(7);
  let done = assert.async();
  let called = false;
  let bb = new Backburner(['one'], {
    onBegin() {
      called = true;
    }
  });
  let function1WasCalled = false;
  let function2WasCalled = false;

  let timer1 = bb.setTimeout(() => function1WasCalled = true, 0);

  assert.ok(timer1, 'Timer object 2 was returned');
  assert.ok(bb.cancel(timer1), 'Cancel for timer 1 returned true');

  let timer2 = bb.setTimeout(() => function2WasCalled = true, 1);

  assert.ok(timer2, 'Timer object 2 was returned');
  assert.ok(!called, 'onBegin was not called');

  setTimeout(() => {
    assert.ok(!function1WasCalled, 'function 1 was not called');
    assert.ok(function2WasCalled, 'function 2 was called');
    assert.ok(called, 'onBegin was called');
    done();
  }, 50);
});

QUnit.test('cancelTimers', function(assert) {
  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  let timer = bb.setTimeout(() => functionWasCalled = true);

  assert.ok(timer, 'Timer object was returned');
  assert.ok(bb.hasTimers(), 'bb has scheduled timer');

  bb.cancelTimers();

  assert.ok(!bb.hasTimers(), 'bb has no scheduled timer');
  assert.ok(!functionWasCalled, 'function was not called');
});

QUnit.test('cancel during flush', function(assert) {
  assert.expect(1);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    let timer1 = bb.deferOnce('one', () => bb.cancel(timer2));
    let timer2 = bb.deferOnce('one', () => functionWasCalled = true);
  });

  assert.ok(!functionWasCalled, 'function was not called');
});

QUnit.test('with GUID_KEY and target', function(assert) {
  assert.expect(3);

  let obj = {
    ___FOO___: 1
  };

  let bb = new Backburner(['action'], {
    GUID_KEY: '___FOO___'
  });

  let wasCalled = 0;

  function fn() {
    wasCalled++;
  }

  bb.run(() => {
    let timer = bb.scheduleOnce('action', obj, fn);

    assert.equal(wasCalled, 0);

    bb.cancel(timer);
    bb.scheduleOnce('action', obj, fn);

    assert.equal(wasCalled, 0);
  });

  assert.equal(wasCalled, 1);
});

QUnit.test('with GUID_KEY and a target without meta', function(assert) {
  assert.expect(3);

  let obj = { };

  let bb = new Backburner(['action'], {
    GUID_KEY: '___FOO___'
  });

  let wasCalled = 0;

  function fn () {
    wasCalled++;
  }

  bb.run(() => {
    let timer = bb.scheduleOnce('action', obj, fn);

    assert.equal(wasCalled, 0);

    bb.cancel(timer);
    bb.scheduleOnce('action', obj, fn);

    assert.equal(wasCalled, 0);
  });

  assert.equal(wasCalled, 1);
});

QUnit.test('with GUID_KEY no target', function(assert) {
  assert.expect(3);

  let bb = new Backburner(['action'], {
    GUID_KEY: '___FOO___'
  });

  let wasCalled = 0;

  function fn () {
    wasCalled++;
  }

  bb.run(() => {
    let timer = bb.scheduleOnce('action', fn);

    assert.equal(wasCalled, 0);

    bb.cancel(timer);
    bb.scheduleOnce('action', fn);

    assert.equal(wasCalled, 0);
  });

  assert.equal(wasCalled, 1);
});
