import Backburner from 'backburner';

QUnit.module('tests/multi-turn');

const queue: any[] = [];
const platform = {
  flushSync() {
    let current = queue.slice();
    queue.length = 0;
    current.forEach((task) => task());
  },

  // TDB actually implement
  next(cb) {
    queue.push(cb);
  }
};

QUnit.test('basic', function(assert) {
  let bb = new Backburner(['zomg'], {

    // This is just a place holder for now, but somehow the system needs to
    // know to when to stop
    mustYield() {
      return true; // yield after each step, for now.
    },
    _platform: platform
  });

  let order = -1;
  let tasks = {
    one:   { count: 0, order: -1 },
    two:   { count: 0, order: -1 },
    three: { count: 0, order: -1 }
  };

  bb.schedule('zomg', null, () => {
    tasks.one.count++;
    tasks.one.order = ++order;
  });

  bb.schedule('zomg', null, () => {
    tasks.two.count++;
    tasks.two.order = ++order;
  });

  bb.schedule('zomg', null, () => {
    tasks.three.count++;
    tasks.three.order = ++order;
  });

  assert.deepEqual(tasks, {
    one:   { count: 0, order: -1 },
    two:   { count: 0, order: -1 },
    three: { count: 0, order: -1 }
  }, 'no tasks have been run before the platform flushes');

  platform.flushSync();

  assert.deepEqual(tasks, {
    one:   { count: 1, order:  0 },
    two:   { count: 0, order: -1 },
    three: { count: 0, order: -1 }
  }, 'TaskOne has been run before the platform flushes');

  platform.flushSync();

  assert.deepEqual(tasks, {
    one:   { count: 1, order:  0 },
    two:   { count: 1, order:  1 },
    three: { count: 0, order: -1 }
  }, 'TaskOne and TaskTwo has been run before the platform flushes');

  platform.flushSync();

  assert.deepEqual(tasks, {
    one:   { count: 1, order:  0 },
    two:   { count: 1, order:  1 },
    three: { count: 1, order:  2 }
  }, 'TaskOne, TaskTwo and TaskThree has been run before the platform flushes');
});

QUnit.test('properly cancel items which are added during flush', function(assert) {
  let bb = new Backburner(['zomg'], {
    // This is just a place holder for now, but somehow the system needs to
    // know to when to stop
    mustYield() {
      return true; // yield after each step, for now.
    },

    _platform: platform
  });

  let fooCalled = 0;
  let barCalled = 0;

  let obj1 = {
    foo() {
      fooCalled++;
    }
  };

  let obj2 = {
    bar() {
      barCalled++;
    }
  };

  bb.scheduleOnce('zomg', obj1, 'foo');
  bb.scheduleOnce('zomg', obj1, 'foo');
  bb.scheduleOnce('zomg', obj2, 'bar');
  bb.scheduleOnce('zomg', obj2, 'bar');

  platform.flushSync();

  let timer1 = bb.scheduleOnce('zomg', obj1, 'foo');
  let timer2 = bb.scheduleOnce('zomg', obj2, 'bar');
  bb.cancel(timer1);
  bb.cancel(timer2);

  platform.flushSync();
  platform.flushSync();
  platform.flushSync();

  assert.equal(fooCalled, 1, 'fooCalled');
  assert.equal(barCalled, 1, 'barCalled');

});
