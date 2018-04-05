import Backburner from 'backburner';

QUnit.module('tests/debug');

QUnit.test('schedule - DEBUG flag enables stack tagging', function(assert) {
  let bb = new Backburner(['one']);

  bb.schedule('one', () => {});
  if (!bb.currentInstance) {
    throw new Error('bb has no instance');
  }

  assert.ok(bb.currentInstance && !bb.currentInstance.queues.one.stackFor(0), 'No stack is recorded');

  bb.DEBUG = true;

  bb.schedule('one', () => {});

  if (new Error().stack) { // workaround for CLI runner :(
    assert.expect(4);
    let done = assert.async();
    let stack = bb.currentInstance && bb.currentInstance.queues.one.stackFor(1);
    assert.ok(typeof stack === 'string', 'A stack is recorded');

    let onError = function(error, errorRecordedForStack) {
      assert.ok(errorRecordedForStack, 'errorRecordedForStack passed to error function');
      assert.ok(errorRecordedForStack.stack, 'stack is recorded');
      done();
    };

    bb = new Backburner(['errors'], { onError });
    bb.DEBUG = true;

    bb.run(() => {
      bb.schedule('errors', () => {
        throw new Error('message!');
      });
    });
  }
});

QUnit.test('later - DEBUG flag off does not capture stack', function(assert) {
  let done = assert.async();
  let onError = function(error, errorRecordedForStack) {
    assert.strictEqual(errorRecordedForStack, undefined, 'errorRecordedForStack is not passed to error function when DEBUG is not set');
    done();
  };
  let bb = new Backburner(['one'], { onError });

  bb.later(() => {
    throw new Error('message!');
  });
});

if (new Error().stack) { // workaround for CLI runner :(
  QUnit.test('later - DEBUG flag on captures stack', function(assert) {
    assert.expect(3);

    let done = assert.async();
    let onError = function(error, errorRecordedForStack) {
      assert.ok(errorRecordedForStack, 'errorRecordedForStack passed to error function');
      assert.ok(errorRecordedForStack.stack, 'stack is recorded');
      assert.ok(errorRecordedForStack.stack.indexOf('later') > -1, 'stack includes `later` invocation');
      done();
    };
    let bb = new Backburner(['one'], { onError });
    bb.DEBUG = true;

    bb.later(() => {
      throw new Error('message!');
    });
  });
}
