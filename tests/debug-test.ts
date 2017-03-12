import Backburner from 'backburner';

QUnit.module('debug');

test('DEBUG flag enables stack tagging', function() {
  let bb = new Backburner(['one']);

  bb.defer('one', function() {});

  ok(bb.currentInstance && !bb.currentInstance.queues.one._queue[3], 'No stack is recorded');

  bb.DEBUG = true;

  bb.defer('one', function() {});

  if (new Error().stack) { // workaround for CLI runner :(
    expect(4);
    let stack = bb.currentInstance && bb.currentInstance.queues.one._queue[7].stack;
    ok(typeof stack === 'string', 'A stack is recorded');

    let onError = function(error, errorRecordedForStack){
      ok(errorRecordedForStack, 'errorRecordedForStack passed to error function');
      ok(errorRecordedForStack.stack, 'stack is recorded');
    };

    bb = new Backburner(['errors'], {onError: onError});
    bb.DEBUG = true;

    bb.run(function(){
      bb.defer('errors', function(){
        throw new Error('message!');
      });
    });
  }
});
