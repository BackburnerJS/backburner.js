import { Backburner } from "backburner";

module("Queue");

test("actions scheduled on previous queue, start over from beginning", function() {
  expect(5);

  var bb = new Backburner(['one', 'two']),
      step = 0;

  bb.run(function() {
    equal(step++, 0, "0");

    bb.schedule('two', null, function() {
      equal(step++, 1, "1");

      bb.schedule('one', null, function() {
        equal(step++, 3, "3");
      });
    });

    bb.schedule('two', null, function() {
      equal(step++, 2, "2");
    });
  });

  equal(step, 4, "4");
});

test("Queue#flush should be recursive if new items are added", function() {
  expect(2);

  var bb = new Backburner(['one']), count = 0;

  bb.run(function() {
    function increment() {
      if (++count < 3) {
        bb.schedule('one', increment);
      }
    }

    increment();
    equal(count, 1, 'should not have run yet');

    bb.currentInstance.queues.one.flush();
    equal(count, 3, 'should have run all scheduled methods, even ones added during flush');
  });

});

test("Default queue is automatically set to first queue if none is provided", function() {
  var bb = new Backburner(['one', 'two']);
  equal(bb.options.defaultQueue, 'one');
});

test("Default queue can be manually configured", function() {
  var bb = new Backburner(['one', 'two'], {
    defaultQueue: 'two'
  });

  equal(bb.options.defaultQueue, 'two');
});

test("onBegin and onEnd are called and passed the correct parameters", function() {
  expect(2);

  var befores = [],
      afters = [],
      expectedBefores = [],
      expectedAfters = [],
      outer, inner;

  var bb = new Backburner(['one'], {
    onBegin: function(current, previous) {
      befores.push(current);
      befores.push(previous);
    },
    onEnd: function(current, next) {
      afters.push(current);
      afters.push(next);
    }
  });

  bb.run(function() {
    outer = bb.currentInstance;
    bb.run(function() {
      inner = bb.currentInstance;
    });
  });

  expectedBefores = [outer, null, inner, outer];
  expectedAfters = [inner, outer, outer, null];

  deepEqual(befores, expectedBefores, "before callbacks successful");
  deepEqual(afters, expectedAfters, "after callback successful");
});


