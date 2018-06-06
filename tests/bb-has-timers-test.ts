import Backburner from 'backburner';

QUnit.module('tests/bb-has-timers');

QUnit.test('hasTimers', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['ohai']);
  let timer;
  let target = {
    fn() { }
  };

  bb.schedule('ohai', null, () => {
    assert.ok(!bb.hasTimers(), 'Initially there are no timers');

    timer = bb.later('ohai', () => {});
    assert.ok(bb.hasTimers(), 'hasTimers checks timers');

    bb.cancel(timer);

    assert.ok(!bb.hasTimers(), 'Timers are cleared');

    timer = bb.debounce(target, 'fn', 200);
    assert.ok(bb.hasTimers(), 'hasTimers checks debouncees');

    bb.cancel(timer);
    assert.ok(!bb.hasTimers(), 'Timers are cleared');

    timer = bb.throttle(target, 'fn', 200);
    assert.ok(bb.hasTimers(), 'hasTimers checks throttlers');

    bb.cancel(timer);
    assert.ok(!bb.hasTimers(), 'Timers are cleared');

    done();
  });
});
