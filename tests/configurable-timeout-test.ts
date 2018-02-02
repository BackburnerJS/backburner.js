import Backburner, { buildPlatform } from 'backburner';

QUnit.module('tests/configurable-timeout');

QUnit.test('We can configure a custom platform', function(assert) {
  assert.expect(1);

  let bb = new Backburner(['one'], {
    _buildPlatform(flush) {
      let platform = buildPlatform(flush);
      platform['isFakePlatform'] = true;
      return platform;
    }
  });

  assert.ok(bb['_platform']!['isFakePlatform'], 'We can pass in a custom platform');
});

QUnit.test('We can use a custom setTimeout', function(assert) {
  assert.expect(1);
  let done = assert.async();

  let customNextWasUsed = false;
  let bb = new Backburner(['one'], {
    _buildPlatform(flush) {
      return {
        next() {
          throw new TypeError('NOT IMPLEMENTED');
        },
        clearNext() { },
        setTimeout(cb) {
          customNextWasUsed = true;
          return setTimeout(cb);
        },
        clearTimeout(timer) {
          return clearTimeout(timer);
        },
        now() {
          return Date.now();
        },
        isFakePlatform: true
      };
    }
  });

  bb.setTimeout(() => {
    assert.ok(customNextWasUsed , 'custom later was used');
    done();
  });
});

QUnit.test('We can use a custom next', function(assert) {
  assert.expect(1);
  let done = assert.async();

  let customNextWasUsed = false;
  let bb = new Backburner(['one'], {
    _buildPlatform(flush) {
      return {
        setTimeout() {
          throw new TypeError('NOT IMPLEMENTED');
        },
        clearTimeout(timer) {
          return clearTimeout(timer);
        },
        next() {
          // next is used for the autorun
          customNextWasUsed = true;
          return setTimeout(flush);
        },
        clearNext() { },
        now() { return Date.now(); },
        isFakePlatform: true
      };
    }
  });

  bb.scheduleOnce('one', () => {
    assert.ok(customNextWasUsed , 'custom later was used');
    done();
  });
});

QUnit.test('We can use a custom clearTimeout', function(assert) {
  assert.expect(2);

  let functionWasCalled = false;
  let customClearTimeoutWasUsed = false;
  let bb = new Backburner(['one'], {
    _buildPlatform(flush) {
      return {
        setTimeout(method, wait) {
          return setTimeout(method, wait);
        },
        clearTimeout(timer) {
          customClearTimeoutWasUsed = true;
          return clearTimeout(timer);
        },
        next() {
          return setTimeout(flush, 0);
        },
        clearNext(timer) {
          customClearTimeoutWasUsed = true;
          return clearTimeout(timer);
        },
        now() {
          return Date.now();
        }
      };
    }
  });

  bb.scheduleOnce('one', () => functionWasCalled = true);
  bb.cancelTimers();

  bb.run(() => {
    bb.scheduleOnce('one', () => {
      assert.ok(!functionWasCalled, 'function was not called');
      assert.ok(customClearTimeoutWasUsed, 'custom clearTimeout was used');
    });
  });
});

QUnit.test('We can use a custom now', function(assert) {
  assert.expect(1);
  let done = assert.async();

  let currentTime = 10;
  let customNowWasUsed = false;
  let bb = new Backburner(['one'], {
    _buildPlatform(flush) {
      return {
        setTimeout(method, wait) {
          return setTimeout(method, wait);
        },
        clearTimeout(id) {
          clearTimeout(id);
        },
        next() {
          return setTimeout(flush, 0);
        },
        clearNext() { },
        now() {
          customNowWasUsed = true;
          return currentTime += 10;
        },
      };
    }
  });

  bb.later(() => {
    assert.ok(customNowWasUsed , 'custom now was used');
    done();
  }, 10);
});
