import Backburner from 'backburner';

QUnit.module('tests/queue');

QUnit.test('actions scheduled on previous queue, start over from beginning', function(assert) {
  assert.expect(5);

  let bb = new Backburner(['one', 'two']);
  let step = 0;

  bb.run(function() {
    assert.equal(step++, 0, '0');

    bb.schedule('two', null, function() {
      assert.equal(step++, 1, '1');

      bb.schedule('one', null, function() {
        assert.equal(step++, 3, '3');
      });
    });

    bb.schedule('two', null, function() {
      assert.equal(step++, 2, '2');
    });
  });

  assert.equal(step, 4, '4');
});

QUnit.test('Queue#flush should be recursive if new items are added', function(assert) {
  assert.expect(2);

  let bb = new Backburner(['one']);
  let count = 0;

  bb.run(function() {
    function increment() {
      if (++count < 3) {
        bb.schedule('one', increment);
      }

      if (count === 3) {

        bb.schedule('one', increment);
      }
    }

    increment();
    assert.equal(count, 1, 'should not have run yet');

    let currentInstance = bb.currentInstance;
    if (currentInstance) {
      currentInstance.queues.one.flush();
    }
    assert.equal(count, 4, 'should have run all scheduled methods, even ones added during flush');
  });

});

QUnit.test('Default queue is automatically set to first queue if none is provided', function(assert) {
  let bb = new Backburner(['one', 'two']);
  assert.equal(bb.options.defaultQueue, 'one');
});

QUnit.test('Default queue can be manually configured', function(assert) {
  let bb = new Backburner(['one', 'two'], {
    defaultQueue: 'two'
  });

  assert.equal(bb.options.defaultQueue, 'two');
});

QUnit.test('onBegin and onEnd are called and passed the correct parameters', function(assert) {
  assert.expect(2);

  let befores: Array<any | null | undefined> = [];
  let afters: Array<any | null | undefined> = [];
  let expectedBefores: Array<any | null | undefined> = [];
  let expectedAfters: Array<any | null | undefined> = [];
  let outer: any;
  let inner: any;

  let bb = new Backburner(['one'], {
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

  assert.deepEqual(befores, expectedBefores, 'before callbacks successful');
  assert.deepEqual(afters, expectedAfters, 'after callback successful');
});
