import Backburner from 'backburner';

const realEnd = Backburner.prototype.end;
QUnit.module('tests/safari-bug', {
  afterEach() {
    Backburner.prototype.end = realEnd;
  }
});

QUnit.test('Prevent Safari double finally in run', function(assert) {
  assert.expect(1);

  let bb = new Backburner(['one']);
  let count = 0;

  Backburner.prototype.end = function() {
    count++;
    assert.equal(count, 1, 'end is called only once');
    realEnd.call(this);
  };

  try {
    bb.run(() => {
      bb.defer('one', () => {
        // If we throw from here, it'll be a throw from
        // the `finally` in `.run()`, thus invoking Safari's
        // bizarre double-finally bug. Without the proper guards,
        // this causes .end() to be run twice in Safari 6.0.2.
        throw 'from defer';
      });
    });
  } catch (e) { }

});

QUnit.test('Prevent Safari double finally in end', function(assert) {
  assert.expect(1);

  let count = 0;
  let bb = new Backburner(['one'], {
    onEnd() {
      count++;
      assert.equal(count, 1, 'onEnd is called only once');

      // If we throw from here, it'll be a throw from
      // the `finally` in `.end()`, thus invoking Safari's
      // bizarre double-finally bug. Without the proper guards,
      // this causes .end() to be run twice in Safari 6.0.2 and iOS 6 and 6.1
      // This issue has been resolved by Safari 6.0.5 and iOS 7
      throw 'from onEnd';
    }
  });

  try {
    bb.run(() => {});
  } catch (e) { }
});
