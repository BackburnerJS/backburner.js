import Backburner from 'backburner';

QUnit.module('tests/events');

QUnit.test('end event should fire after runloop completes', function(assert) {
  assert.expect(3);
  let callNumber = 0;

  let bb = new Backburner(['one', 'two']);

  bb.on('end', () => callNumber++);

  function funcOne() {
    assert.equal(callNumber, 0);
  }

  function funcTwo() {
    assert.equal(callNumber, 0);
  }

  bb.run(() => {
    bb.schedule('one', null, funcOne);
    bb.schedule('two', null, funcTwo);
  });

  assert.equal(callNumber, 1);
});

QUnit.test('end event should fire before onEnd', function(assert) {
  assert.expect(3);
  let callNumber = 0;

  let bb = new Backburner(['one', 'two'], {
    onEnd() {
      assert.equal(callNumber, 1);
    }
  });

  bb.on('end', () => callNumber++);

  function funcOne() {
    assert.equal(callNumber, 0);
  }

  function funcTwo() {
    assert.equal(callNumber, 0);
  }

  bb.run(() => {
    bb.schedule('one', null, funcOne);
    bb.schedule('two', null, funcTwo);
  });
});

QUnit.test('end event should be passed the current and next instance', function(assert) {
  assert.expect(4);
  let callNumber = 0;

  let firstArgument = null;
  let secondArgument = null;

  let bb = new Backburner(['one'], {
    onEnd(first, second) {
      assert.equal(firstArgument, first);
      assert.equal(secondArgument, second);
    }
  });

  bb.on('end', (first, second) => {
    firstArgument = first;
    secondArgument = second;
  });

  bb.run(() => bb.schedule('one', null, () => {}));
  bb.run(() => bb.schedule('one', null, () => {}));
});
// blah

QUnit.test('begin event should fire before runloop begins', function(assert) {
  assert.expect(4);
  let callNumber = 0;

  let bb = new Backburner(['one', 'two']);

  bb.on('begin', () => callNumber++);

  function funcOne() {
    assert.equal(callNumber, 1);
  }

  function funcTwo() {
    assert.equal(callNumber, 1);
  }

  assert.equal(callNumber, 0);
  bb.run(() => {
    bb.schedule('one', null, funcOne);
    bb.schedule('two', null, funcTwo);
  });

  assert.equal(callNumber, 1);
});

QUnit.test('begin event should fire before onBegin', function(assert) {
  assert.expect(1);
  let callNumber = 0;

  let bb = new Backburner(['one', 'two'], {
    onBegin() {
      assert.equal(callNumber, 1);
    }
  });

  bb.on('begin', () => callNumber++);

  bb.run(() => {
    bb.schedule('one', null, () => {});
    bb.schedule('two', null, () => {});
  });
});

QUnit.test('begin event should be passed the current and previous instance', function(assert) {
  assert.expect(4);
  let callNumber = 0;

  let firstArgument = null;
  let secondArgument = null;

  let bb = new Backburner(['one'], {
    onBegin(first, second) {
      assert.equal(firstArgument, first);
      assert.equal(secondArgument, second);
    }
  });

  bb.on('begin', (first, second) => {
    firstArgument = first;
    secondArgument = second;
  });

  bb.run(() => bb.schedule('one', null, () => {}));
  bb.run(() => bb.schedule('one', null, () => {}));
});

// blah
QUnit.test('events should work with multiple callbacks', function(assert) {
  assert.expect(2);
  let firstCalled = false;
  let secondCalled = false;

  let bb = new Backburner(['one']);

  function first() {
    firstCalled = true;
  }

  function second() {
    secondCalled = true;
  }

  bb.on('end', first);
  bb.on('end', second);

  bb.run(() => bb.schedule('one', null, () => {}));

  assert.equal(secondCalled, true);
  assert.equal(firstCalled, true);
});

QUnit.test('off should unregister specific callback', function(assert) {
  assert.expect(2);
  let firstCalled = false;
  let secondCalled = false;

  let bb = new Backburner(['one']);

  function first() {
    firstCalled = true;
  }

  function second() {
    secondCalled = true;
  }

  bb.on('end', first);
  bb.on('end', second);

  bb.off('end', first);

  bb.run(() => bb.schedule('one', null, () => {}));

  assert.equal(secondCalled, true);
  assert.equal(firstCalled, false);
});
