import Backburner from 'backburner';
import MockStableError, {
  overrideError,
  pushStackTrace,
  resetError,
} from './utils/mock-stable-error';

QUnit.module('tests/defer-debug-info', {
  beforeEach: function() {
    // @ts-ignore
    overrideError(MockStableError);
  },

  afterEach: function() {
    resetError();
  }
});

QUnit.test('_getDebugInfo returns empty object with DEBUG = false', function(assert) {
  assert.expect(1);

  let debugInfo;
  let bb = new Backburner(['render', 'afterRender']);

  bb.run(() => {
    debugInfo = bb.currentInstance && bb.currentInstance._getDebugInfo(bb.DEBUG);

    assert.equal(debugInfo, undefined);
  });
});

QUnit.test('_getDebugInfo returns debugInfo when DEBUG = true', function(assert) {
  assert.expect(1);

  let debugInfo;
  let method = () => {};
  let afterRenderStack = pushStackTrace('afterRender stack');
  let renderStack = pushStackTrace('render stack');
  let bb = new Backburner(['render', 'afterRender']);

  bb.DEBUG = true;

  bb.run(() => {
    bb.schedule('render', method);
    bb.schedule('afterRender', method);

    debugInfo = bb.currentInstance && bb.currentInstance._getDebugInfo(bb.DEBUG);

    assert.deepEqual(debugInfo, {
      render: [
        {
          target: null,
          method,
          args: undefined,
          stack: renderStack
        }
      ],
      afterRender: [
        {
          target: null,
          method,
          args: undefined,
          stack: afterRenderStack
        }
      ]
    });
  });
});
