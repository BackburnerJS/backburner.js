import { Backburner } from "backburner";
var originalDateValueOf = Date.prototype.valueOf;

module("defer", {
  teardown: function(){
    Date.prototype.valueOf = originalDateValueOf;
  }
});

test("when passed a function", function() {
  expect(1);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    bb.defer('one', function() {
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, "function was called");
});

test("when passed a target and method", function() {
  expect(2);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    bb.defer('one', {zomg: "hi"}, function() {
      equal(this.zomg, "hi", "the target was properly set");
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, "function was called");
});

test("when passed a target, method, and arguments", function() {
  expect(5);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    bb.defer('one', {zomg: "hi"}, function(a, b, c) {
      equal(this.zomg, "hi", "the target was properly set");
      equal(a, 1, "the first arguments was passed in");
      equal(b, 2, "the second arguments was passed in");
      equal(c, 3, "the third arguments was passed in");
      functionWasCalled = true;
    }, 1, 2, 3);
  });

  ok(functionWasCalled, "function was called");
});

module("deferOnce");
test("when passed a function", function() {
  expect(1);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    bb.deferOnce('one', function() {
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, "function was called");
});

test("when passed a target and method", function() {
  expect(2);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    bb.deferOnce('one', {zomg: "hi"}, function() {
      equal(this.zomg, "hi", "the target was properly set");
      functionWasCalled = true;
    });
  });

  ok(functionWasCalled, "function was called");
});

test("when passed a target, method, and arguments", function() {
  expect(5);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    bb.deferOnce('one', {zomg: "hi"}, function(a, b, c) {
      equal(this.zomg, "hi", "the target was properly set");
      equal(a, 1, "the first arguments was passed in");
      equal(b, 2, "the second arguments was passed in");
      equal(c, 3, "the third arguments was passed in");
      functionWasCalled = true;
    }, 1, 2, 3);
  });

  ok(functionWasCalled, "function was called");
});

module("helpers");
test("setTimeout", function() {
  expect(6);

  var bb = new Backburner(['one']),
      step = 0,
      instance;

  // Force +new Date to return the same result while scheduling
  // run.later timers. Otherwise: non-determinism!
  var now = +new Date();
  Date.prototype.valueOf = function() { return now; };

  stop();
  bb.setTimeout(null, function() {
    start();
    instance = bb.currentInstance;
    equal(step++, 0);
  }, 10);

  bb.setTimeout(null, function() {
    equal(step++, 1);
    equal(instance, bb.currentInstance, "same instance");
  }, 10);

  Date.prototype.valueOf = originalDateValueOf;

  stop();
  setTimeout(function() {
    start();
    equal(step++, 2);

    stop();
    bb.setTimeout(null, function() {
      start();
      equal(step++, 3);
      ok(true, "Another later will execute correctly");
    }, 1);
  }, 20);
});

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

test("autorun", function() {
  var bb = new Backburner(['zomg']),
      step = 0;

  ok(!bb.currentInstance, "The DeferredActionQueues object is lazily instaniated");
  equal(step++, 0);

  bb.schedule('zomg', null, function() {
    start();
    equal(step, 2);
    stop();
    setTimeout(function() {
      start();
      ok(!bb.hasTimers(), "The all timers are cleared");
    });
  });

  ok(bb.currentInstance, "The DeferredActionQueues object exists");
  equal(step++, 1);
  stop();
});

test("cancel - null", function() {
  // mimic browser behavior: window.clearTimeout(null) -> undefined
  expect(3);
  var bb = new Backburner(['cancel']);
  equal(bb.cancel(), undefined, "cancel with no arguments should return undefined");
  equal(bb.cancel(null), undefined, "cancel a null timer should return undefined");
  equal(bb.cancel(undefined), undefined, "cancel an undefined timer should return undefined");
});

module("cancel");
test("deferOnce", function() {
  expect(3);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    var timer = bb.deferOnce('one', function() {
      functionWasCalled = true;
    });

    ok(timer, "Timer object was returned");
    ok(bb.cancel(timer), "Cancel returned true");
    ok(!functionWasCalled, "function was not called");
  });
});

test("setTimeout", function() {
  expect(3);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  var timer = bb.setTimeout(function() {
    functionWasCalled = true;
  }, 0);

  ok(timer, "Timer object was returned");
  ok(bb.cancel(timer), "Cancel returned true");
  ok(!functionWasCalled, "function was not called");
});

test("cancelTimers", function() {
  var bb = new Backburner(['one']),
      functionWasCalled = false;

  var timer = bb.setTimeout(function() {
    functionWasCalled = true;
  }, 0);

  ok(timer, "Timer object was returned");
  ok(bb.hasTimers(), "bb has scheduled timer");

  bb.cancelTimers();

  ok(!bb.hasTimers(), "bb has no scheduled timer");
  ok(!functionWasCalled, "function was not called");
});

module("safari bugs");
test("Prevent Safari double finally", function() {
  expect(1);

  var bb = new Backburner(['one']),
      count = 0,
      realEnd = Backburner.prototype.end;

  Backburner.prototype.end = function() {
    count++;
    equal(count, 1, 'end is called only once');
    realEnd.call(this);
  };

  try {
    bb.run(function() {
      bb.defer('one', function() {
        // If we throw from here, it'll be a throw from
        // the `finally` in `.run()`, thus invoking Safari's
        // bizarre double-finally bug. Without the proper guards,
        // this causes .end() to be run twice in Safari 6.0.2.
        throw 'from defer';
      });
    });
  }
  catch(e) { }

  Backburner.prototype.end = realEnd;
});

module("Queue");
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

module("debug");
test("DEBUG flag enables stack tagging", function() {
  var bb = new Backburner(['one']);

  bb.defer('one', function() {});

  ok(!bb.currentInstance.queues.one._queue[3], "No stack is recorded");

  bb.DEBUG = true;

  bb.defer('one', function() {});

  if (new Error().stack) { // workaround for CLI runner :(
    ok(typeof bb.currentInstance.queues.one._queue[7] === 'string', "A stack is recorded");
  }
});
