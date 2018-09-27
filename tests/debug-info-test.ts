import Backburner from 'backburner';
import MockStableError, {
  overrideError,
  pushStackTrace,
  resetError,
} from './utils/mock-stable-error';

QUnit.module('tests/debug-info', {
  beforeEach: function() {
    // @ts-ignore
    overrideError(MockStableError);
  },

  afterEach: function() {
    resetError();
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

QUnit.test('getDebugInfo returns debugInfo using later when DEBUG = true', function(assert) {
  assert.expect(1);

  let debugInfo;
  let target1 = { one: true };
  let target2 = { two: true };
  let method = () => {};
  let arg1 = 1;
  let arg2 = 2;
  let twoStack = pushStackTrace('Two stack');
  let oneStack = pushStackTrace('One stack');
  let bb = new Backburner(['one']);

  bb.DEBUG = true;

  bb.run(function() {
    bb.later(target1, method, arg1, 1000);
    bb.later(target2, method, arg1, arg2, 1000);

    debugInfo = bb.currentInstance && bb.getDebugInfo();

    resetError();

    assert.deepEqual(debugInfo.timers,
    [
      {
        args: [arg1],
        method,
        stack: oneStack,
        target: target1
      },
      {
        args: [arg1, arg2],
        method,
        stack: twoStack,
        target: target2
      }
    ]
    , 'debugInfo is output');
  });
});

QUnit.test('getDebugInfo returns debugInfo using when DEBUG = true', function(assert) {
  assert.expect(1);

  let debugInfo;
  let target1 = { one: true };
  let target2 = { two: true };
  let method = () => {};
  let arg1 = 1;
  let arg2 = 2;
  let twoStack = pushStackTrace('Two stack');
  let oneStack = pushStackTrace('One stack');
  let bb = new Backburner(['one', 'two']);

  bb.DEBUG = true;

  bb.run(function() {
    bb.schedule('one', target1, method, arg1);
    bb.schedule('two', target2, method, arg1, arg2);

    debugInfo = bb.currentInstance && bb.getDebugInfo();

    resetError();

    assert.deepEqual(debugInfo.instanceStack,
    [
      {
        one: [
          {
            args: [arg1],
            method,
            stack: oneStack,
            target: target1
          }
        ],
        two: [
          {
            args: [arg1, arg2],
            method,
            stack: twoStack,
            target: target2
          }
        ]
      }
    ]
    , 'debugInfo is output');
  });
});

QUnit.test('getDebugInfo returns debugInfo when DEBUG = true in nested run', function(assert) {
  assert.expect(1);

  let debugInfo;
  let method = () => {};
  let twoStack = pushStackTrace('Two stack');
  let oneStack = pushStackTrace('One stack');
  let fourStack = pushStackTrace('Four stack');
  let threeStack = pushStackTrace('Three stack');
  let bb = new Backburner(['one', 'two', 'three', 'four']);

  bb.DEBUG = true;

  bb.run(function() {
    bb.schedule('one', method);
    bb.schedule('two', method);

    bb.run(function() {
      bb.schedule('three', method);
      bb.schedule('four', method);

      debugInfo = bb.currentInstance && bb.getDebugInfo();

      resetError();

      assert.deepEqual(debugInfo.instanceStack,
        [
          {
            four: [
              {
                args: undefined,
                method,
                stack: fourStack,
                target: null
              }
            ],
            one: [],
            three: [
              {
                args: undefined,
                method,
                stack: threeStack,
                target: null
              }
            ],
            two: []
          },
          {
            four: [],
            one: [
              {
                args: undefined,
                method,
                stack: oneStack,
                target: null
              }
            ],
            three: [],
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
      , 'debugInfo is output');
      });
    });
});
