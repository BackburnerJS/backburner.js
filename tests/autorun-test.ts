import Backburner from 'backburner';

QUnit.module('tests/autorun');

QUnit.test('autorun', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['zomg']);
  let step = 0;

  assert.ok(!bb.currentInstance, 'The DeferredActionQueues object is lazily instaniated');
  assert.equal(step++, 0);

  bb.schedule('zomg', null, () => {
    assert.equal(step, 2);
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
