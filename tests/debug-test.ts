import Backburner from 'backburner';

QUnit.module('tests/debug');

QUnit.test('DEBUG flag enables stack tagging', function(assert) {
  let bb = new Backburner(['one']);

  bb.defer('one', () => {});

  assert.ok(bb.currentInstance && !bb.currentInstance.queues.one._queue[3], 'No stack is recorded');

  bb.DEBUG = true;

  bb.defer('one', () => {});

  if (new Error().stack) { // workaround for CLI runner :(
    assert.expect(4);
    let stack = bb.currentInstance && bb.currentInstance.queues.one._queue[7].stack;
    assert.ok(typeof stack === 'string', 'A stack is recorded');

    let onError = function(error, errorRecordedForStack){
      assert.ok(errorRecordedForStack, 'errorRecordedForStack passed to error function');
      assert.ok(errorRecordedForStack.stack, 'stack is recorded');
    };

    bb = new Backburner(['errors'], {onError: onError});
    bb.DEBUG = true;

    bb.run(() => {
      bb.defer('errors', () => {
        throw new Error('message!');
      });
    });
  }
});
