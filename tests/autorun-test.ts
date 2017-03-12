import Backburner from 'backburner';

QUnit.module('autorun');

test('autorun', function() {
  let bb = new Backburner(['zomg']);
  let step = 0;

  ok(!bb.currentInstance, 'The DeferredActionQueues object is lazily instaniated');
  equal(step++, 0);

  bb.schedule('zomg', null, function() {
    start();
    equal(step, 2);
    stop();
    setTimeout(function() {
      start();
      ok(!bb.hasTimers(), 'The all timers are cleared');
    });
  });

  ok(bb.currentInstance, 'The DeferredActionQueues object exists');
  equal(step++, 1);
  stop();
});
