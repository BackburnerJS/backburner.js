
import Backburner from 'backburner';

QUnit.module('tests/cancel');

QUnit.test('scheduleOnce', function(assert) {
  assert.expect(3);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    let timer = bb.scheduleOnce('one', () => functionWasCalled = true);

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
  let timer = bb.later(() => functionWasCalled = true);

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

  let timer1 = bb.later(() => function1WasCalled = true);
  let timer2 = bb.later(() => function2WasCalled = true);

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

QUnit.test('setTimeout and creating a new later', function(assert) {
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

  let timer1 = bb.later(() => function1WasCalled = true, 0);

  assert.ok(timer1, 'Timer object 2 was returned');
  assert.ok(bb.cancel(timer1), 'Cancel for timer 1 returned true');

  let timer2 = bb.later(() => function2WasCalled = true, 1);

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
  assert.expect(8);
  let done = assert.async();

  let bb = new Backburner(['one']);
  let laterWasCalled = false;
  let debounceWasCalled = false;
  let throttleWasCalled = false;

  let timer1 = bb.later(() => laterWasCalled = true, 0);
  let timer2 = bb.debounce(() => debounceWasCalled = true, 0);
  let timer3 = bb.throttle(() => throttleWasCalled = true, 0, false);

  assert.ok(timer1, 'Timer object was returned');
  assert.ok(timer2, 'Timer object was returned');
  assert.ok(timer3, 'Timer object was returned');
  assert.ok(bb.hasTimers(), 'bb has scheduled timer');

  bb.cancelTimers();

  setTimeout(function() {
    assert.ok(!bb.hasTimers(), 'bb has no scheduled timer');
    assert.ok(!laterWasCalled, 'later function was not called');
    assert.ok(!debounceWasCalled, 'debounce function was not called');
    assert.ok(!throttleWasCalled, 'throttle function was not called');
    done();
  }, 100);
});

QUnit.test('cancel during flush', function(assert) {
  assert.expect(1);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(() => {
    let timer1 = bb.scheduleOnce('one', () => bb.cancel(timer2));
    let timer2 = bb.scheduleOnce('one', () => functionWasCalled = true);
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

QUnit.test('with GUID_KEY no target', function(assert) {
  assert.expect(3);

  let bb = new Backburner(['action'], {
    GUID_KEY: '___FOO___'
  });

  let wasCalled = 0;

  function fn() {
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

QUnit.test('with peekGuid and target', function(assert) {
  assert.expect(3);

  let obj = {};

  let bb = new Backburner(['action'], {
    peekGuid(obj2) {
      if (obj === obj2) { return 1; }
    }
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

QUnit.test('with peekGuid and a target without guid', function(assert) {
  assert.expect(3);

  let obj = { };

  let bb = new Backburner(['action'], {
    peekGuid() { }
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

QUnit.test('with peekGuid no target', function(assert) {
  assert.expect(3);

  let bb = new Backburner(['action'], {
    peekGuid() { }
  });

  let wasCalled = 0;

  function fn() {
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

QUnit.test('cancel always returns boolean', function(assert) {
  let bb = new Backburner(['one']);

  bb.run(function() {
    let timer1 = bb.schedule('one', null, function() {});
    assert.equal(bb.cancel(timer1), true);
    assert.equal(bb.cancel(timer1), false);
    assert.equal(bb.cancel(timer1), false);

    let timer2 = bb.later(function() {}, 10);
    assert.equal(bb.cancel(timer2), true);
    assert.equal(bb.cancel(timer2), false);
    assert.equal(bb.cancel(timer2), false);

    let timer3 = bb.debounce(function() {}, 10);
    assert.equal(bb.cancel(timer3), true);
    assert.equal(bb.cancel(timer3), false);
    assert.equal(bb.cancel(timer3), false);

    assert.equal(bb.cancel(undefined), false);
    assert.equal(bb.cancel(null), false);
    assert.equal(bb.cancel({}), false);
    assert.equal(bb.cancel([]), false);
    assert.equal(bb.cancel(42), false);
    assert.equal(bb.cancel('42'), false);
  });
});
