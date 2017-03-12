import Backburner from 'backburner';

QUnit.module('Events');

test('end event should fire after runloop completes', function() {
  expect(3);
  let callNumber = 0;

  let bb = new Backburner(['one', 'two']);

  bb.on('end', () => callNumber++);

  function funcOne() {
    equal(callNumber, 0);
  }

  function funcTwo() {
    equal(callNumber, 0);
  }

  bb.run(() => {
    bb.schedule('one', null, funcOne);
    bb.schedule('two', null, funcTwo);
  });

  equal(callNumber, 1);
});

test('end event should fire before onEnd', function() {
  expect(3);
  let callNumber = 0;

  let bb = new Backburner(['one', 'two'], {
    onEnd() {
      equal(callNumber, 1);
    }
  });

  bb.on('end', () => callNumber++);

  function funcOne() {
    equal(callNumber, 0);
  }

   function funcTwo() {
    equal(callNumber, 0);
  }

  bb.run(() => {
    bb.schedule('one', null, funcOne);
    bb.schedule('two', null, funcTwo);
  });
});

test('end event should be passed the current and next instance', function() {
  expect(4);
  let callNumber = 0;

  let firstArgument = null;
  let secondArgument = null;

  let bb = new Backburner(['one'], {
    onEnd(first, second) {
      equal(firstArgument, first);
      equal(secondArgument, second);
    }
  });

  bb.on('end', (first, second) => {
    firstArgument = first;
    secondArgument = second;
  });

  bb.run(() => {
    bb.schedule('one', null, () => {});
  });

  bb.run(() => {
    bb.schedule('one', null, () => {});
  });
});
// blah

test('begin event should fire before runloop begins', function() {
  expect(4);
  let callNumber = 0;

  let bb = new Backburner(['one', 'two']);

  bb.on('begin', () => callNumber++);

  function funcOne() {
    equal(callNumber, 1);
  }

  function funcTwo() {
    equal(callNumber, 1);
  }

  equal(callNumber, 0);
  bb.run(() => {
    bb.schedule('one', null, funcOne);
    bb.schedule('two', null, funcTwo);
  });

  equal(callNumber, 1);
});

test('begin event should fire before onBegin', function() {
  expect(1);
  let callNumber = 0;

  let bb = new Backburner(['one', 'two'], {
    onBegin() {
      equal(callNumber, 1);
    }
  });

  bb.on('begin', () => callNumber++);

  bb.run(() => {
    bb.schedule('one', null, () => {});
    bb.schedule('two', null, () => {});
  });
});

test('begin event should be passed the current and previous instance', function() {
  expect(4);
  let callNumber = 0;

  let firstArgument = null;
  let secondArgument = null;

  let bb = new Backburner(['one'], {
    onBegin(first, second) {
      equal(firstArgument, first);
      equal(secondArgument, second);
    }
  });

  bb.on('begin', (first, second) => {
    firstArgument = first;
    secondArgument = second;
  });

  bb.run(() => {
    bb.schedule('one', null, () => {});
  });

  bb.run(() => {
    bb.schedule('one', null, () => {});
  });
});

// blah
test('events should work with multiple callbacks', function() {
  expect(2);
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

  bb.run(() => {
    bb.schedule('one', null, () => {});
  });

  equal(secondCalled, true);
  equal(firstCalled, true);
});

test('off should unregister specific callback', function() {
  expect(2);
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

  bb.run(() => {
    bb.schedule('one', null, () => {});
  });

  equal(secondCalled, true);
  equal(firstCalled, false);
});
