import Backburner from '../lib/backburner';
import GlobalContext from '../lib/backburner/platform';

module('configurable platform.setTimeout');

test('We can configure a custom platform', function() {
  expect(1);

  var fakePlatform = {
    setTimeout: function() {},
    clearTimeout: function() {},
    isFakePlatform: true
  };

  var bb = new Backburner(['one'], {
    platform: fakePlatform
  });

  ok(bb.options.platform.isFakePlatform, 'We can pass in a custom platform');
});

test('We can use a custom setTimeout', function() {
  expect(2);

  var customTimeoutWasUsed = false;
  var bb = new Backburner(['one'], {
    platform: {
      setTimeout: function customSetTimeout(method, wait) {
        customTimeoutWasUsed = true;
        return GlobalContext.setTimeout(method, wait);
      },
      clearTimeout: function customClearTimeout(timer) {
        return GlobalContext.clearTimeout(timer);
      },
      isFakePlatform: true
    }
  });

  stop();
  bb.deferOnce('one', function() {
    start();
    ok(bb.options.platform.isFakePlatform, 'we are using the fake platform');
    ok(customTimeoutWasUsed , 'custom setTimeout was used');
  });
});


test('We can use a custom clearTimeout', function() {
  expect(2);

  var functionWasCalled = false;
  var customClearTimeoutWasUsed = false;
  var bb = new Backburner(['one'], {
    platform: {
      setTimeout: function customSetTimeout(method, wait) {
        return GlobalContext.setTimeout(method, wait);
      },
      clearTimeout: function customClearTimeout(timer) {
        customClearTimeoutWasUsed = true;
        return GlobalContext.clearTimeout(timer);
      }
    }
  });

  bb.deferOnce('one', function() {
    functionWasCalled = true;
  });
  bb.cancelTimers();

  bb.run(function() {
    bb.deferOnce('one', function() {
      ok(!functionWasCalled, 'function was not called');
      ok(customClearTimeoutWasUsed, 'custom clearTimeout was used');
    });
  });
});
