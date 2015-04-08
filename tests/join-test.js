import Backburner from '../lib/backburner';

module('join');

function depth(bb) {
  return bb.instanceStack.length + (bb.currentInstance ? 1 : 0);
}

test('outside of a run loop', function() {
  expect(4);

  var bb = new Backburner(['one']);

  equal(depth(bb), 0);
  var result = bb.join(function() {
    equal(depth(bb), 1);
    return 'result';
  });
  equal(result, 'result');
  equal(depth(bb), 0);
});

test('inside of a run loop', function() {
  expect(4);

  var bb = new Backburner(['one']);

  equal(depth(bb), 0);
  bb.run(function() {
    var result = bb.join(function() {
      equal(depth(bb), 1);
      return 'result';
    });
    equal(result, 'result');
  });
  equal(depth(bb), 0);
});

test('nested join calls', function() {
  expect(7);

  var bb = new Backburner(['one']);

  equal(depth(bb), 0);
  bb.join(function() {
    equal(depth(bb), 1);
    bb.join(function() {
      equal(depth(bb), 1);
      bb.join(function() {
        equal(depth(bb), 1);
      });
      equal(depth(bb), 1);
    });
    equal(depth(bb), 1);
  });
  equal(depth(bb), 0);
});

test('nested run loops', function() {
  expect(7);

  var bb = new Backburner(['one']);

  equal(depth(bb), 0);
  bb.join(function() {
    equal(depth(bb), 1);
    bb.run(function() {
      equal(depth(bb), 2);
      bb.join(function() {
        equal(depth(bb), 2);
      });
      equal(depth(bb), 2);
    });
    equal(depth(bb), 1);
  });
  equal(depth(bb), 0);
});

test('queue execution order', function() {
  expect(1);

  var bb = new Backburner(['one']);
  var items = [];

  bb.run(function() {
    items.push(0);
    bb.schedule('one', function() {
      items.push(4);
    });
    bb.join(function() {
      items.push(1);
      bb.schedule('one', function() {
        items.push(5);
      });
      items.push(2);
    });
    bb.schedule('one', function() {
      items.push(6);
    });
    items.push(3);
  });
  deepEqual(items, [0, 1, 2, 3, 4, 5, 6]);
});
