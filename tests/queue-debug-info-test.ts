import Backburner from 'backburner';
import MockStableError, { pushStackTrace, overrideError } from './utils/mock-stable-error';

QUnit.module('tests/queue-debug-info', {
  beforeEach: function() {
    // @ts-ignore
    overrideError(MockStableError);
  },

  afterEach: function() {
    overrideError();
  }
});

QUnit.test('getDebugInfo returns empty array when no debug info is present.', function(assert) {
  assert.expect(1);

  let debugInfo;
  let bb = new Backburner(['one']);

  bb.run(function() {
    debugInfo = bb.currentInstance && bb.currentInstance.queues.one._getDebugInfo(bb.DEBUG);

    assert.equal(debugInfo, undefined, 'DebugInfo is undefined when DEBUG = false');
  });
});

QUnit.test('getDebugInfo returns minimal debug info when one item in queue.', function(assert) {
  assert.expect(2);

  let debugInfo;
  let method = function() {
    assert.ok(true);
  };
  let stack = pushStackTrace('Top of stack');
  let bb = new Backburner(['one']);

  bb.DEBUG = true;

  bb.run(function() {
    bb.schedule('one', method);

    debugInfo = bb.currentInstance && bb.currentInstance.queues.one._getDebugInfo(bb.DEBUG);

    assert.deepEqual(debugInfo, [{
      target: null,
      method,
      args: undefined,
      stack
    }]);
  });
});

QUnit.test('getDebugInfo returns full debug info when one item in queue.', function(assert) {
  assert.expect(2);

  let debugInfo;
  let target = {};
  let method = function() {
    assert.ok(true);
  };
  let arg1 = 1;
  let arg2 = 2;
  let stack = pushStackTrace('Top of stack');
  let bb = new Backburner(['one']);

  bb.DEBUG = true;

  bb.run(function() {
    bb.schedule('one', target, method, arg1, arg2);

    debugInfo = bb.currentInstance && bb.currentInstance.queues.one._getDebugInfo(bb.DEBUG);

    assert.deepEqual(debugInfo, [{
      target,
      method,
      args: [arg1, arg2],
      stack
    }]);
  });
});

QUnit.test('getDebugInfo returns debug info when multiple items in queue.', function(assert) {
  assert.expect(3);

  let debugInfo;
  let method = function() {
    assert.ok(true);
  };
  let bottom = pushStackTrace('Bottom');
  let top = pushStackTrace('Top');
  let bb = new Backburner(['one']);

  bb.DEBUG = true;

  bb.run(function() {
    bb.schedule('one', method);
    bb.schedule('one', method);

    debugInfo = bb.currentInstance && bb.currentInstance.queues.one._getDebugInfo(bb.DEBUG);

    assert.deepEqual(debugInfo, [
      {
        target: null,
        method,
        args: undefined,
        stack: top
      },
      {
        target: null,
        method,
        args: undefined,
        stack: bottom
      }
    ]);
  });
});
