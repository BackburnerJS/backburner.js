import { Backburner } from "backburner";

module("debounce");

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
  // it will be executed 40ms after
  bb.debounce(null, debouncee, 40);
  equal(step++, 0);

  // let's schedule `debouncee` to run in 10ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 1);
    ok(!wasCalled);
    bb.debounce(null, debouncee, 40);
  }, 10);

  // let's schedule `debouncee` to run again in 30ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 2);
    ok(!wasCalled);
    bb.debounce(null, debouncee, 40);
  }, 30);

  // let's schedule `debouncee` to run yet again in 60ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 3);
    ok(!wasCalled);
    bb.debounce(null, debouncee, 40);
  }, 60);

  // now, let's schedule an assertion to occur at 110ms,
  // 10ms after `debouncee` has been called the last time
  stop();
  setTimeout(function() {
    start();
    equal(step++, 4);
    ok(wasCalled);
  }, 110);

  // great, we've made it this far, there's one more thing
  // we need to test. we want to make sure we can call `debounce`
  // again with the same target/method after it has executed

  // at the 120ms mark, let's schedule another call to `debounce`
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
    }, 230);
  }, 120);
});

test("debounce - immediate", function() {
  expect(16);

  var bb = new Backburner(['zomg']),
      step = 0;

  var wasCalled = false;
  function debouncee() {
    ok(!wasCalled);
    wasCalled = true;
  }

  // let's debounce the function `debouncee` for 40ms
  // it will be executed immediately, and prevent
  // any actions for 40ms after
  bb.debounce(null, debouncee, 40, true);
  equal(step++, 0);
  ok(wasCalled);
  wasCalled = false;

  // let's schedule `debouncee` to run in 10ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 1);
    ok(!wasCalled);
    bb.debounce(null, debouncee, 40, true);
  }, 10);

  // let's schedule `debouncee` to run again in 30ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 2);
    ok(!wasCalled);
    bb.debounce(null, debouncee, 40, true);
  }, 30);

  // let's schedule `debouncee` to run yet again in 60ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 3);
    ok(!wasCalled);
    bb.debounce(null, debouncee, 40, true);
  }, 60);

  // now, let's schedule an assertion to occur at 110ms,
  // 10ms after `debouncee` has been called the last time
  stop();
  setTimeout(function() {
    start();
    equal(step++, 4);
    ok(!wasCalled);
  }, 110);

  // great, we've made it this far, there's one more thing
  // we need to test. we want to make sure we can call `debounce`
  // again with the same target/method after it has executed

  // at the 120ms mark, let's schedule another call to `debounce`
  stop();
  setTimeout(function() {
    wasCalled = false; // reset the flag

    // assert call order
    start();
    equal(step++, 5);

    // call debounce for the second time
    bb.debounce(null, debouncee, 100, true);
    ok(wasCalled, "Another debounce call with the same function can be executed later");
    wasCalled = false;

    // assert that it is called in the future and not blackholed
    stop();
    setTimeout(function() {
      start();
      equal(step++, 6);
      ok(!wasCalled);
    }, 230);
  }, 120);
});

test("debounce accept time interval like string numbers", function() {

  var bb = new Backburner(['zomg']),
      step = 0;

  var wasCalled = false;
  function debouncee() {
    ok(!wasCalled);
    wasCalled = true;
  }

  bb.debounce(null, debouncee, "40");
  equal(step++, 0);

  stop();
  setTimeout(function() {
    start();
    equal(step++, 1);
    ok(!wasCalled);
    bb.debounce(null, debouncee, "40");
  }, 10);

  stop();
  setTimeout(function() {
    start();
    equal(step++, 2);
    ok(wasCalled);
  }, 60);

});

test("debounce returns timer information usable for cancelling", function() {
  expect(3);

  var bb = new Backburner(['batman']),
      timer;

  var wasCalled = false;

  function debouncee() {
    ok(false, "this method shouldn't be called");
    wasCalled = true;
  }

  timer = bb.debounce(null, debouncee, 1);

  ok(bb.cancel(timer), "the timer is cancelled");

  //should return false second time around
  ok(!bb.cancel(timer), "the timer no longer exists in the list");

  stop();
  setTimeout(function() {
    start();
    ok(!wasCalled, "the timer wasn't called after waiting");
  }, 60);

});

test("debounce cancelled after it's executed returns false", function() {
  expect(3);

  var bb = new Backburner(['darkknight']),
      timer;

  var wasCalled = false;

  function debouncee() {
    ok(true, "the debounced method was called");
    wasCalled = true;
  }

  timer = bb.debounce(null, debouncee, 1);

  stop();
  setTimeout(function() {
    start();
    ok(!bb.cancel(timer), "no timer existed to cancel");
    ok(wasCalled, "the timer was actually called");
  }, 10);

});

test("debounce cancelled doesn't cancel older items", function() {
  expect(4);

  var bb = new Backburner(['robin']),
      timer;

  var wasCalled = false;

  function debouncee() {
    ok(true, "the debounced method was called");
    wasCalled = true;
  }

  timer = bb.debounce(null, debouncee, 1);

  stop();
  setTimeout(function() {
    start();
    bb.debounce(null, debouncee, 1);
    ok(!bb.cancel(timer), "the second timer isn't removed, despite appearing to be the same");
    ok(wasCalled, "the timer was actually called");
  }, 10);

});

test("debounce that is immediate, and cancelled and called again happens immediately", function() {
  expect(3);

  var bb = new Backburner(['robin']),
      timer;

  var calledCount = 0;

  function debouncee() {
    calledCount++;
  }

  timer = bb.debounce(null, debouncee, 1000, true);

  stop();
  setTimeout(function() { // 10 millisecond delay
    start();
    equal(1, calledCount, "debounced method was called");
    ok(bb.cancel(timer), "debounced delay was cancelled");
    bb.debounce(null, debouncee, 1000, true);

    stop();
    setTimeout(function(){ // 10 millisecond delay
      start();
      equal(2, calledCount, "debounced method was called again immediately");
    }, 10);
  }, 10);

});
