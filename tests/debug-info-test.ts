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

    assert.deepEqual(debugInfo.instanceStack,
    [
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
    , 'debugInfo is output');
  });
});