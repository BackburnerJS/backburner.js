import Queue from "backburner/queue";

module("Queue.prototpye.pushUnique");
var slice = [].slice;

test("pushUnique: 2 different targets", function() {
  var queue = new Queue("foo");
  var target1fooWasCalled = [];
  var target2fooWasCalled = [];
  var target1 = {
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    }
  };

  var target2 = {
    foo: function() {
      target2fooWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target2, target2.foo, ['b']);

  deepEqual(target1fooWasCalled, []);
  deepEqual(target2fooWasCalled, []);

  queue.flush();

  deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  deepEqual(target1fooWasCalled[0], ['a']);
  deepEqual(target2fooWasCalled.length, 1, 'expected: target 2.foo to be called only once');
  deepEqual(target2fooWasCalled[0], ['b']);
});

test("pushUnique: 1 target, 2 different methods", function() {
  var queue = new Queue("foo");
  var target1fooWasCalled = [];
  var target1barWasCalled = [];
  var target1 = {
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    },
    bar: function() {
      target1barWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target1, target1.bar, ['b']);

  deepEqual(target1fooWasCalled, []);
  deepEqual(target1barWasCalled, []);

  queue.flush();

  deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  deepEqual(target1fooWasCalled[0], ['a']);
  deepEqual(target1barWasCalled.length, 1, 'expected: target 1.bar to be called only once');
  deepEqual(target1barWasCalled[0], ['b']);
});

test("pushUnique: 1 target, 1 different methods called twice", function() {
  var queue = new Queue("foo");
  var target1fooWasCalled = [];
  var target1 = {
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target1, target1.foo, ['b']);

  deepEqual(target1fooWasCalled, []);

  queue.flush();

  deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  deepEqual(target1fooWasCalled[0], ['b']);
});

test("pushUnique: 2 different targets (GUID_KEY)", function() {
  var queue = new Queue("foo", {}, { GUID_KEY: 'GUID_KEY' });
  var target1fooWasCalled = [];
  var target2fooWasCalled = [];
  var target1 = {
    GUID_KEY: 'target1',
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    }
  };

  var target2 = {
    GUID_KEY: 'target2',
    foo: function() {
      target2fooWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target2, target2.foo, ['b']);

  deepEqual(target1fooWasCalled, []);
  deepEqual(target2fooWasCalled, []);

  queue.flush();

  deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  deepEqual(target1fooWasCalled[0], ['a']);
  deepEqual(target2fooWasCalled.length, 1, 'expected: target 2.foo to be called only once');
  deepEqual(target2fooWasCalled[0], ['b']);
});

test("pushUnique: 1 target, 2 different methods (GUID_KEY)", function() {
  var queue = new Queue("foo", {}, { GUID_KEY: 'GUID_KEY' });
  var target1fooWasCalled = [];
  var target1barWasCalled = [];
  var target1 = {
    GUID_KEY: 'target1',
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    },
    bar: function() {
      target1barWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target1, target1.bar, ['b']);

  deepEqual(target1fooWasCalled, []);
  deepEqual(target1barWasCalled, []);

  queue.flush();

  deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  deepEqual(target1fooWasCalled[0], ['a']);
  deepEqual(target1barWasCalled.length, 1, 'expected: target 1.bar to be called only once');
  deepEqual(target1barWasCalled[0], ['b']);
});

test("pushUnique: 1 target, 1 diffe`rent methods called twice (GUID_KEY)", function() {
  var queue = new Queue("foo", {}, { GUID_KEY: 'GUID_KEY' });
  var target1fooWasCalled = [];
  var target1 = {
    GUID_KEY: 'target1',
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target1, target1.foo, ['b']);

  deepEqual(target1fooWasCalled, []);

  queue.flush();

  deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  deepEqual(target1fooWasCalled[0], ['b']);
});

