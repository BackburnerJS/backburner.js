import Backburner from 'backburner';

let Queue = (Backburner as any).Queue;

QUnit.module('tests/queue-push-unique');
let slice = [].slice;

QUnit.test('pushUnique: 2 different targets', function(assert) {
  let queue = new Queue('foo');
  let target1fooWasCalled: string[][] = [];
  let target2fooWasCalled: string[][] = [];
  let target1 = {
    foo() {
      target1fooWasCalled.push(slice.call(arguments));
    }
  };

  let target2 = {
    foo() {
      target2fooWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target2, target2.foo, ['b']);

  assert.deepEqual(target1fooWasCalled, []);
  assert.deepEqual(target2fooWasCalled, []);

  queue.flush();

  assert.deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  assert.deepEqual(target1fooWasCalled[0], ['a']);
  assert.deepEqual(target2fooWasCalled.length, 1, 'expected: target 2.foo to be called only once');
  assert.deepEqual(target2fooWasCalled[0], ['b']);
});

QUnit.test('pushUnique: 1 target, 2 different methods', function(assert) {
  let queue = new Queue('foo');
  let target1fooWasCalled: string[][] = [];
  let target1barWasCalled: string[][] = [];
  let target1 = {
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    },
    bar: function() {
      target1barWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target1, target1.bar, ['b']);

  assert.deepEqual(target1fooWasCalled, []);
  assert.deepEqual(target1barWasCalled, []);

  queue.flush();

  assert.deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  assert.deepEqual(target1fooWasCalled[0], ['a']);
  assert.deepEqual(target1barWasCalled.length, 1, 'expected: target 1.bar to be called only once');
  assert.deepEqual(target1barWasCalled[0], ['b']);
});

QUnit.test('pushUnique: 1 target, 1 different methods called twice', function(assert) {
  let queue = new Queue('foo');
  let target1fooWasCalled: string[][] = [];
  let target1 = {
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target1, target1.foo, ['b']);

  assert.deepEqual(target1fooWasCalled, []);

  queue.flush();

  assert.deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  assert.deepEqual(target1fooWasCalled[0], ['b']);
});

QUnit.test('pushUnique: 2 different targets (GUID_KEY)', function(assert) {
  let queue = new Queue('foo', {}, { GUID_KEY: 'GUID_KEY' });
  let target1fooWasCalled: string[][] = [];
  let target2fooWasCalled: string[][] = [];
  let target1 = {
    GUID_KEY: 'target1',
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    }
  };

  let target2 = {
    GUID_KEY: 'target2',
    foo: function() {
      target2fooWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target2, target2.foo, ['b']);

  assert.deepEqual(target1fooWasCalled, []);
  assert.deepEqual(target2fooWasCalled, []);

  queue.flush();

  assert.deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  assert.deepEqual(target1fooWasCalled[0], ['a']);
  assert.deepEqual(target2fooWasCalled.length, 1, 'expected: target 2.foo to be called only once');
  assert.deepEqual(target2fooWasCalled[0], ['b']);
});

QUnit.test('pushUnique: 1 target, 2 different methods (GUID_KEY)', function(assert) {
  let queue = new Queue('foo', {}, { GUID_KEY: 'GUID_KEY' });
  let target1fooWasCalled: string[][] = [];
  let target1barWasCalled: string[][] = [];
  let target1 = {
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

  assert.deepEqual(target1fooWasCalled, []);
  assert.deepEqual(target1barWasCalled, []);

  queue.flush();

  assert.deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  assert.deepEqual(target1fooWasCalled[0], ['a']);
  assert.deepEqual(target1barWasCalled.length, 1, 'expected: target 1.bar to be called only once');
  assert.deepEqual(target1barWasCalled[0], ['b']);
});

QUnit.test('pushUnique: 1 target, 1 diffe`rent methods called twice (GUID_KEY)', function(assert) {
  let queue = new Queue('foo', {}, { GUID_KEY: 'GUID_KEY' });
  let target1fooWasCalled: string[][] = [];
  let target1 = {
    GUID_KEY: 'target1',
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target1, target1.foo, ['b']);

  assert.deepEqual(target1fooWasCalled, []);

  queue.flush();

  assert.deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  assert.deepEqual(target1fooWasCalled[0], ['b']);
});

QUnit.test('pushUnique: 1 target, 2 different methods, second one called twice (GUID_KEY)', function(assert) {
  let queue = new Queue('foo', {}, { GUID_KEY: 'GUID_KEY' });
  let target1barWasCalled: string[][] = [];
  let target1 = {
    GUID_KEY: 'target1',
    foo: function() {
    },
    bar: function() {
      target1barWasCalled.push(slice.call(arguments));
    }
  };

  queue.pushUnique(target1, target1.foo);
  queue.pushUnique(target1, target1.bar, ['a']);
  queue.pushUnique(target1, target1.bar, ['b']);

  assert.deepEqual(target1barWasCalled, []);

  queue.flush();

  assert.deepEqual(target1barWasCalled.length, 1, 'expected: target 1.bar to be called only once');
});

QUnit.test('pushUnique: 2 different targets (peekGuid)', function(assert) {
  let guidIndexer = [];
  let queue = new Queue('foo', {}, {
    peekGuid(obj) {
      let guid = guidIndexer.indexOf(obj);
      if (guid === -1) {
        return null;
      }

      return guid;
    }
  });

  let target1fooWasCalled: string[][] = [];
  let target2fooWasCalled: string[][] = [];
  let target1 = {
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    }
  };
  guidIndexer.push(target1);

  let target2 = {
    foo: function() {
      target2fooWasCalled.push(slice.call(arguments));
    }
  };
  guidIndexer.push(target2);

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target2, target2.foo, ['b']);

  assert.deepEqual(target1fooWasCalled, []);
  assert.deepEqual(target2fooWasCalled, []);

  queue.flush();

  assert.deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  assert.deepEqual(target1fooWasCalled[0], ['a']);
  assert.deepEqual(target2fooWasCalled.length, 1, 'expected: target 2.foo to be called only once');
  assert.deepEqual(target2fooWasCalled[0], ['b']);
});

QUnit.test('pushUnique: 1 target, 2 different methods (peekGuid)', function(assert) {
  let guidIndexer = [];
  let queue = new Queue('foo', {}, {
    peekGuid(obj) {
      let guid = guidIndexer.indexOf(obj);
      if (guid === -1) {
        return null;
      }

      return guid;
    }

  });
  let target1fooWasCalled: string[][] = [];
  let target1barWasCalled: string[][] = [];
  let target1 = {
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    },
    bar: function() {
      target1barWasCalled.push(slice.call(arguments));
    }
  };
  guidIndexer.push(target1);

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target1, target1.bar, ['b']);

  assert.deepEqual(target1fooWasCalled, []);
  assert.deepEqual(target1barWasCalled, []);

  queue.flush();

  assert.deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  assert.deepEqual(target1fooWasCalled[0], ['a']);
  assert.deepEqual(target1barWasCalled.length, 1, 'expected: target 1.bar to be called only once');
  assert.deepEqual(target1barWasCalled[0], ['b']);
});

QUnit.test('pushUnique: 1 target, 1 different methods called twice (peekGuid)', function(assert) {
  let guidIndexer = [];
  let queue = new Queue('foo', {}, {
    peekGuid(obj) {
      let guid = guidIndexer.indexOf(obj);
      if (guid === -1) {
        return null;
      }

      return guid;
    }

  });
  let target1fooWasCalled: string[][] = [];
  let target1 = {
    foo: function() {
      target1fooWasCalled.push(slice.call(arguments));
    }
  };
  guidIndexer.push(target1);

  queue.pushUnique(target1, target1.foo, ['a']);
  queue.pushUnique(target1, target1.foo, ['b']);

  assert.deepEqual(target1fooWasCalled, []);

  queue.flush();

  assert.deepEqual(target1fooWasCalled.length, 1, 'expected: target 1.foo to be called only once');
  assert.deepEqual(target1fooWasCalled[0], ['b']);
});

QUnit.test('pushUnique: 1 target, 2 different methods, second one called twice (peekGuid)', function(assert) {
  let guidIndexer = [];
  let queue = new Queue('foo', {}, {
    peekGuid(obj) {
      let guid = guidIndexer.indexOf(obj);
      if (guid === -1) {
        return null;
      }

      return guid;
    }
  });

  let target1barWasCalled: string[][] = [];
  let target1 = {
    foo: function() {
    },
    bar: function() {
      target1barWasCalled.push(slice.call(arguments));
    }
  };
  guidIndexer.push(target1);

  queue.pushUnique(target1, target1.foo);
  queue.pushUnique(target1, target1.bar, ['a']);
  queue.pushUnique(target1, target1.bar, ['b']);

  assert.deepEqual(target1barWasCalled, []);

  queue.flush();

  assert.deepEqual(target1barWasCalled.length, 1, 'expected: target 1.bar to be called only once');
});
