import Backburner from 'backburner';

const skipIfNotSupported = !!console['createTask'] ? QUnit.test : QUnit.skip;

QUnit.module('tests/async_stacks');

QUnit.test('schedule - does not affect normal behaviour', function(assert) {
  let bb = new Backburner(['one']);
  let callCount = 0;

  bb.run(() => {
    bb.schedule('one', () => callCount += 1)
    bb.schedule('one', () => callCount += 1)
  });
  assert.strictEqual(callCount, 2, 'schedule works correctly with ASYNC_STACKS disabled');

  bb.ASYNC_STACKS = true;

  bb.run(() => {
    bb.schedule('one', () => callCount += 1)
    bb.schedule('one', () => callCount += 1)
  });
  assert.strictEqual(callCount, 4, 'schedule works correctly with ASYNC_STACKS enabled');
});

skipIfNotSupported('schedule - ASYNC_STACKS flag enables async stack tagging', function(assert) {
  let bb = new Backburner(['one']);

  bb.schedule('one', () => {});

  assert.true(bb.currentInstance && (bb.currentInstance.queues.one.consoleTaskFor(0) === undefined), 'No consoleTask is stored');

  bb.ASYNC_STACKS = true;

  bb.schedule('one', () => {});

  const task = bb.currentInstance && bb.currentInstance.queues.one.consoleTaskFor(1);
  assert.true(!!task?.run, 'consoleTask is stored in queue');
});

QUnit.test('later - ASYNC_STACKS does not affect normal behaviour', function(assert) {
  let bb = new Backburner(['one']);
  let done = assert.async();
  bb.ASYNC_STACKS = true;

  bb.later(() => {
    assert.true(true, 'timer called')
    done()
  });
});


skipIfNotSupported('later - skips async stack when ASYNC_STACKS is false', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['one']);

  bb.later(() => {
    const task = bb.currentInstance && bb.currentInstance.queues.one.consoleTaskFor(0, true);
    assert.true(bb.currentInstance && (bb.currentInstance.queues.one.consoleTaskFor(0, true) === undefined), 'consoleTask is not stored')
    done();
  });
});


skipIfNotSupported('later - ASYNC_STACKS flag enables async stack tagging', function(assert) {
  let done = assert.async();
  let bb = new Backburner(['one']);
  bb.ASYNC_STACKS = true;

  bb.later(() => {
    const task = bb.currentInstance && bb.currentInstance.queues.one.consoleTaskFor(0, true);
    assert.true(!!task?.run, 'consoleTask is stored in timer queue and then passed to runloop queue')
    done();
  });
});
