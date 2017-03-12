import Backburner from 'backburner';

QUnit.module('hasTimers');

test('hasTimers', function () {
  let bb = new Backburner(['ohai']);
  let timer;
  let target = {
    fn() { }
  };

  bb.schedule('ohai', null, () => {
    ok(!bb.hasTimers(), 'Initially there are no timers');
    start();

    timer = bb.later('ohai', () => {});
    ok(bb.hasTimers(), 'hasTimers checks timers');

    bb.cancel(timer);
    ok(!bb.hasTimers(), 'Timers are cleared');

    timer = bb.debounce(target, 'fn', 200);
    ok(bb.hasTimers(), 'hasTimers checks debouncees');

    bb.cancel(timer);
    ok(!bb.hasTimers(), 'Timers are cleared');

    timer = bb.throttle(target, 'fn', 200);
    ok(bb.hasTimers(), 'hasTimers checks throttlers');

    bb.cancel(timer);
    ok(!bb.hasTimers(), 'Timers are cleared');
  });

  stop();
});
