import Backburner from 'backburner';
import MockStableError, { pushStackTrace, overrideError } from './utils/mock-stable-error';

QUnit.module('tests/debug-info', {
  beforeEach: function() {
    // @ts-ignore
    overrideError(MockStableError);
  },

  afterEach: function() {
    overrideError();
  }
});

QUnit.test('getDebugInfo returns undefined when DEBUG = false', function(assert) {
  assert.expect(1);

  let debugInfo;
  let bb = new Backburner(['one']);

  bb.run(function() {
    debugInfo = bb.currentInstance && bb.getDebugInfo();

    assert.equal(debugInfo, undefined, 'DebugInfo is undefined when DEBUG = false');
  });
});

QUnit.test('getDebugInfo returns debugInfo when DEBUG = true', function(assert) {
  assert.expect(1);

  let debugInfo;
  let method = () => {};
  let twoStack = pushStackTrace('Two stack');
  let oneStack = pushStackTrace('One stack');
  let bb = new Backburner(['one', 'two']);

  bb.DEBUG = true;

  bb.run(function() {
    bb.schedule('one', method);
    bb.schedule('two', method);

    debugInfo = bb.currentInstance && bb.getDebugInfo();

    assert.deepEqual(debugInfo, {
      counters: {
        "autoruns": {
          "completed": 0,
          "created": 0
        },
        "begin": 1,
        "cancel": 0,
        "cancelTimers": 0,
        "debounce": 0,
        "defer": 0,
        "deferOnce": 0,
        "end": 0,
        "events": {
          "begin": 1,
          "end": 0
        },
        "join": 0,
        "later": 0,
        "loops": {
          "nested": 0,
          "total": 1
        },
        "run": 1,
        "schedule": 2,
        "scheduleIterable": 0,
        "scheduleOnce": 0,
        "setTimeout": 0,
        "throttle": 0
      },
      instanceStack: [
        {
          one: [
            {
              args: undefined,
              method,
              stack: oneStack,
              target: null
            }
          ],
          two: [
            {
              args: undefined,
              method,
              stack: twoStack,
              target: null
            }
          ]
        }
      ]
    }, 'debugInfo is output');
  });
});