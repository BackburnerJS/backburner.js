import Backburner from 'backburner';

QUnit.module('safari bug');

test('Prevent Safari double finally in run', function() {
  expect(1);

  let bb = new Backburner(['one']);
  let count = 0;
  let realEnd = Backburner.prototype.end;

  Backburner.prototype.end = function() {
    count++;
    equal(count, 1, 'end is called only once');
    realEnd.call(this);
  };

  try {
    bb.run(function() {
      bb.defer('one', () => {
        // If we throw from here, it'll be a throw from
        // the `finally` in `.run()`, thus invoking Safari's
        // bizarre double-finally bug. Without the proper guards,
        // this causes .end() to be run twice in Safari 6.0.2.
        throw 'from defer';
      });
    });
  } catch (e) { }

  Backburner.prototype.end = realEnd;
});

test('Prevent Safari double finally in end', function() {
  expect(1);

  let count = 0;
  let bb = new Backburner(['one'], {
        onEnd() {
          count++;
          equal(count, 1, 'onEnd is called only once');

          // If we throw from here, it'll be a throw from
          // the `finally` in `.end()`, thus invoking Safari's
          // bizarre double-finally bug. Without the proper guards,
          // this causes .end() to be run twice in Safari 6.0.2 and iOS 6 and 6.1
          // This issue has been resolved by Safari 6.0.5 and iOS 7
          throw 'from onEnd';
        }
      });

  try {
    bb.run(() => {
      // No-op
    });
  } catch (e) { }
});
