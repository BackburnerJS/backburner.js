import Backburner from 'backburner';

QUnit.module('configurable platform.setTimeout');

test('We can configure a custom platform', function() {
  expect(1);

  let fakePlatform = {
    setTimeout() {},
    clearTimeout() {},
    isFakePlatform: true
  };

  let bb = new Backburner(['one'], {
    _platform: fakePlatform
  });

  ok(bb.options._platform.isFakePlatform, 'We can pass in a custom platform');
});

test('We can use a custom setTimeout', function() {
  expect(2);

  let customTimeoutWasUsed = false;
  let bb = new Backburner(['one'], {
    _platform: {
      setTimeout(method, wait) {
        customTimeoutWasUsed = true;
        return setTimeout(method, wait);
      },
      clearTimeout(timer) {
        return clearTimeout(timer);
      },
      isFakePlatform: true
    }
  });

  stop();
  bb.deferOnce('one', () => {
    start();
    ok(bb.options._platform.isFakePlatform, 'we are using the fake platform');
    ok(customTimeoutWasUsed , 'custom setTimeout was used');
  });
});

test('We can use a custom clearTimeout', function() {
  expect(2);

  let functionWasCalled = false;
  let customClearTimeoutWasUsed = false;
  let bb = new Backburner(['one'], {
    _platform: {
      setTimeout(method, wait) {
        return setTimeout(method, wait);
      },
      clearTimeout(timer) {
        customClearTimeoutWasUsed = true;
        return clearTimeout(timer);
      }
    }
  });

  bb.deferOnce('one', () => functionWasCalled = true);
  bb.cancelTimers();

  bb.run(() => {
    bb.deferOnce('one', () => {
      ok(!functionWasCalled, 'function was not called');
      ok(customClearTimeoutWasUsed, 'custom clearTimeout was used');
    });
  });
});
