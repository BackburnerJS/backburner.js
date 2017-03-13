import Backburner from 'backburner';

QUnit.module('tests/configurable-timeout');

QUnit.test('We can configure a custom platform', function(assert) {
  assert.expect(1);

  let fakePlatform = {
    setTimeout() {},
    clearTimeout() {},
    isFakePlatform: true
  };

  let bb = new Backburner(['one'], {
    _platform: fakePlatform
  });

  assert.ok(bb.options._platform.isFakePlatform, 'We can pass in a custom platform');
});

QUnit.test('We can use a custom setTimeout', function(assert) {
  assert.expect(2);
  let done = assert.async();

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

  bb.deferOnce('one', () => {
    assert.ok(bb.options._platform.isFakePlatform, 'we are using the fake platform');
    assert.ok(customTimeoutWasUsed , 'custom setTimeout was used');
    done();
  });
});

QUnit.test('We can use a custom clearTimeout', function(assert) {
  assert.expect(2);

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
      },
      next(method) {
        return setTimeout(method, 0);
      },
      clearNext(timer) {
        customClearTimeoutWasUsed = true;
        return clearTimeout(timer);
      }
    }
  });

  bb.deferOnce('one', () => functionWasCalled = true);
  bb.cancelTimers();

  bb.run(() => {
    bb.deferOnce('one', () => {
      assert.ok(!functionWasCalled, 'function was not called');
      assert.ok(customClearTimeoutWasUsed, 'custom clearTimeout was used');
    });
  });
});
