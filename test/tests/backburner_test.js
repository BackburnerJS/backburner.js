import Backburner from "backburner";

var originalDateValueOf = Date.prototype.valueOf;

module("Backburner");

test("run when passed a function", function() {
  expect(1);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run(function() {
    functionWasCalled = true;
  });

  ok(functionWasCalled, "function was called");
});

test("run when passed a target and method", function() {
  expect(2);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run({zomg: "hi"}, function() {
    equal(this.zomg, "hi", "the target was properly set");
    functionWasCalled = true;
  });

  ok(functionWasCalled, "function was called");
});

test("run when passed a target, method, and arguments", function() {
  expect(5);

  var bb = new Backburner(['one']),
      functionWasCalled = false;

  bb.run({zomg: "hi"}, function(a, b, c) {
    equal(this.zomg, "hi", "the target was properly set");
    equal(a, 1, "the first arguments was passed in");
    equal(b, 2, "the second arguments was passed in");
    equal(c, 3, "the third arguments was passed in");
    functionWasCalled = true;
  }, 1, 2, 3);

  ok(functionWasCalled, "function was called");
});

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

test("runs can be nested", function() {
  expect(2);

  var bb = new Backburner(['one']),
      step = 0;

  bb.run(function() {
    equal(step++, 0);

    bb.run(function() {
      equal(step++, 1);
    });
  });
});

test("autorun", function() {
  var bb = new Backburner(['zomg']),
      step = 0;

  ok(!bb.currentInstance, "The DeferredActionQueues object is lazily instaniated");
  equal(step++, 0);

  bb.schedule('zomg', null, function() {
    start();
    equal(step, 2);
  });

  ok(bb.currentInstance, "The DeferredActionQueues object exists");
  equal(step++, 1);
  stop();
});


test("debounce", function() {
  expect(14);

  var bb = new Backburner(['zomg']),
      step = 0;

  var wasCalled = false;
  function debouncee() {
    ok(!wasCalled);
    wasCalled = true;
  }

  // let's debounce the function `debouncee` for 40ms
  // it will be executed in 40ms
  bb.debounce(null, debouncee, 40);
  equal(step++, 0);

  // let's schedule `debouncee` to run in 10ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 1);
    ok(!wasCalled);
    bb.debounce(null, debouncee);
  }, 10);

  // let's schedule `debouncee` to run again in 20ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 2);
    ok(!wasCalled);
    bb.debounce(null, debouncee);
  }, 20);

  // let's schedule `debouncee` to run yet again in 30ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 3);
    ok(!wasCalled);
    bb.debounce(null, debouncee);
  }, 30);

  // at 40ms, `debouncee` will get called once

  // now, let's schedule an assertion to occur at 50ms,
  // 10ms after `debouncee` has been called
  stop();
  setTimeout(function() {
    start();
    equal(step++, 4);
    ok(wasCalled);
  }, 50);

  // great, we've made it this far, there's one more thing
  // we need to test. we want to make sure we can call `debounce`
  // again with the same target/method after it has executed


  // at the 60ms mark, let's schedule another call to `debounce`
  stop();
  setTimeout(function() {
    wasCalled = false; // reset the flag

    // assert call order
    start();
    equal(step++, 5);

    // call debounce for the second time
    bb.debounce(null, debouncee, 100);

    // assert that it is called in the future and not blackholed
    stop();
    setTimeout(function() {
      start();
      equal(step++, 6);
      ok(wasCalled, "Another debounce call with the same function can be executed later");
    }, 110);
  }, 60);
});
