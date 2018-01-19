import Backburner from 'backburner';

QUnit.module('tests/defer-iterable');

class Iterator {
  private _collection: Function[];
  private _iteration: number = 0;
  constructor(collection: Function[]) {
    this._collection = collection;
  }

  public next() {
    let iteration = this._iteration++;
    let collection = this._collection;
    let done = collection.length <= iteration;

    let value = done ? undefined : collection[iteration];

    return {
      done,
      value
    };
  }
}

QUnit.test('deferIterable', function(assert) {
  let bb = new Backburner(['zomg']);
  let order = 0;

  let tasks = {
    one:   { count: 0, order: -1 },
    two:   { count: 0, order: -1 },
    three: { count: 0, order: -1 }
  };

  function task1() {
    tasks.one.count++;
    tasks.one.order = order++;
  }

  function task2() {
    tasks.two.count++;
    tasks.two.order = order++;
  }

  function task3() {
    tasks.three.count++;
    tasks.three.order = order++;
  }

  let iterator = () => new Iterator([
    task1,
    task2,
    task3
  ]);

  bb.run(() => {
    bb.scheduleIterable('zomg', iterator);

    assert.deepEqual(tasks, {
      one:   { count: 0,  order: -1 },
      two:   { count: 0,  order: -1 },
      three: { count: 0,  order: -1 }
    });
  });

  assert.deepEqual(tasks, {
    one:   { count: 1,  order: 0 },
    two:   { count: 1,  order: 1 },
    three: { count: 1,  order: 2 }
  });
});
