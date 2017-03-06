import Backburner from 'backburner';

QUnit.module('configurable platform.setTimeout');

test('We can configure a custom platform', function() {
  expect(1);

  var fakePlatform = {
    setTimeout: function() {},
    clearTimeout: function() {},
    isFakePlatform: true
  };

  var bb = new Backburner(['one'], {
    _platform: fakePlatform
  });

  ok(bb.options._platform.isFakePlatform, 'We can pass in a custom platform');
});

test('We can use a custom setTimeout', function() {
  expect(2);

  var customTimeoutWasUsed = false;
  var bb = new Backburner(['one'], {
    _platform: {
      setTimeout: function customSetTimeout(method, wait) {
        customTimeoutWasUsed = true;
        return setTimeout(method, wait);
      },
      clearTimeout: function customClearTimeout(timer) {
        return clearTimeout(timer);
      },
      isFakePlatform: true
    }
  });

  stop();
  bb.deferOnce('one', function() {
    start();
    ok(bb.options._platform.isFakePlatform, 'we are using the fake platform');
    ok(customTimeoutWasUsed , 'custom setTimeout was used');
  });
});


test('We can use a custom clearTimeout', function() {
  expect(2);

  var functionWasCalled = false;
  var customClearTimeoutWasUsed = false;
  var bb = new Backburner(['one'], {
    _platform: {
      setTimeout: function customSetTimeout(method, wait) {
        return setTimeout(method, wait);
      },
      clearTimeout: function customClearTimeout(timer) {
        customClearTimeoutWasUsed = true;
        return clearTimeout(timer);
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
