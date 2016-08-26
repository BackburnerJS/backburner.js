import Backburner from 'backburner';

module('debug');

test('DEBUG flag enables stack tagging', function() {
  var bb = new Backburner(['one']);

  bb.defer('one', function() {});

  ok(!bb.currentInstance.queues.one._queue[3], 'No stack is recorded');

  bb.DEBUG = true;

  bb.defer('one', function() {});

  if (new Error().stack) { // workaround for CLI runner :(
    expect(4);
    var stack = bb.currentInstance.queues.one._queue[7].stack;
    ok(typeof stack === 'string', 'A stack is recorded');

    var onError = function(error, errorRecordedForStack){
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
