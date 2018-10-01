import Backburner from 'backburner';
import lolex from 'lolex';

// used to ensure tests for fake timers can reliably use native setTimeout
const SET_TIMEOUT = setTimeout;
let fakeClock;

QUnit.module('tests/autorun', {
  afterEach() {
    if (fakeClock) {
      fakeClock.uninstall();
    }
  }
});

QUnit.test('autorun', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['zomg']);
  let step = 0;

  assert.ok(!bb.currentInstance, 'The DeferredActionQueues object is lazily instaniated');
  assert.equal(step++, 0);

  bb.schedule('zomg', null, () => {
    assert.equal(step++, 2);
    setTimeout(() => {
      assert.ok(!bb.hasTimers(), 'The all timers are cleared');
      done();
    });
  });

  assert.ok(bb.currentInstance, 'The DeferredActionQueues object exists');
  assert.equal(step++, 1);
});

QUnit.test('autorun (joins next run if not yet flushed)', function(assert) {
  let bb = new Backburner(['zomg']);
  let order = -1;

  let tasks = {
    one: { count: 0, order: -1 },
    two: { count: 0, order: -1 }
  };

  bb.schedule('zomg', null, () => {
    tasks.one.count++;
    tasks.one.order = ++order;
  });

  assert.deepEqual(tasks, {
    one: { count: 0, order: -1 },
    two: { count: 0, order: -1 }
  });

  bb.run(() => {
    bb.schedule('zomg', null, () => {
      tasks.two.count++;
      tasks.two.order = ++order;
    });

    assert.deepEqual(tasks, {
      one: { count: 0, order: -1 },
      two: { count: 0, order: -1 }
    });
  });

  assert.deepEqual(tasks, {
    one: { count: 1, order: 0 },
    two: { count: 1, order: 1 }
  });
});

QUnit.test('autorun completes before items scheduled by later (via microtasks)', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['first', 'second']);
  let order = new Array();

  // this later will be scheduled into the `first` queue when
  // its timer is up
  bb.later(() => {
    order.push('second - later');
  }, 0);

  // scheduling this into the second queue so that we can confirm this _still_
  // runs first (due to autorun resolving before scheduled timer)
  bb.schedule('second', null, () => {
    order.push('first - scheduled');
  });

  setTimeout(() => {
    assert.deepEqual(order, ['first - scheduled', 'second - later']);
    done();
  }, 20);
});

QUnit.test('can be canceled (private API)', function(assert) {
  assert.expect(0);

  let done = assert.async();
  let bb = new Backburner(['zomg']);

  bb.schedule('zomg', null, () => {
    assert.notOk(true, 'should not flush');
  });

  bb['_cancelAutorun']();

  setTimeout(done, 10);
});

QUnit.test('autorun interleaved with microtasks do not get dropped [GH#332]', function(assert) {
  let done = assert.async();
  let actual: string[] = [];
  let bb = new Backburner(['actions', 'render']);

  bb.schedule('render', function() {
    actual.push('first');
    bb.schedule('actions', () => {
      actual.push('action1');
    });

    Promise.resolve().then(() => {
      actual.push('second');
      bb.schedule('actions', () => {
        actual.push('action2');
      });

      return Promise.resolve().then(() => {
        actual.push('third');

        bb.schedule('actions', () => {
          actual.push('action3');
        });
      });
    });
  });

  setTimeout(function() {
    assert.deepEqual(actual, ['first', 'action1', 'second', 'action2', 'third', 'action3']);

    done();
  });
});

QUnit.test('autorun functions even when using fake timers', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['zomg']);
  let step = 0;

  assert.ok(!bb.currentInstance, 'The DeferredActionQueues object is lazily instaniated');
  assert.equal(step++, 0);

  fakeClock = lolex.install();
  bb.schedule('zomg', null, () => {
    assert.equal(step++, 2);
    SET_TIMEOUT(() => {
      assert.ok(!bb.hasTimers(), 'The all timers are cleared');
      done();
    });
  });

  assert.ok(bb.currentInstance, 'The DeferredActionQueues object exists');
  assert.equal(step++, 1);
});
