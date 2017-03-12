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
