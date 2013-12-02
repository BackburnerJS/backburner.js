import { Backburner } from "backburner";

module("throttle");

test("throttle", function() {
  expect(18);

  var bb = new Backburner(['zomg']),
      step = 0;

  var wasCalled = false;
  function throttler() {
    ok(!wasCalled);
    wasCalled = true;
  }

  // let's throttle the function `throttler` for 40ms
  // it will be executed in 40ms
  bb.throttle(null, throttler, 40);
  equal(step++, 0);

  // let's schedule `throttler` to run in 10ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 1);
    ok(!wasCalled);
    bb.throttle(null, throttler);
  }, 10);

  // let's schedule `throttler` to run again in 20ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 2);
    ok(!wasCalled);
    bb.throttle(null, throttler);
  }, 20);

  // let's schedule `throttler` to run yet again in 30ms
  stop();
  setTimeout(function() {
    start();
    equal(step++, 3);
    ok(!wasCalled);
    bb.throttle(null, throttler);
  }, 30);

  // at 40ms, `throttler` will get called once

  // now, let's schedule an assertion to occur at 50ms,
  // 10ms after `throttler` has been called
  stop();
  setTimeout(function() {
    start();
    equal(step++, 4);
    ok(wasCalled);
  }, 50);

  // great, we've made it this far, there's one more thing
  // we need to test. we want to make sure we can call `throttle`
  // again with the same target/method after it has executed


  // at the 60ms mark, let's schedule another call to `throttle`
  stop();
  setTimeout(function() {
    wasCalled = false; // reset the flag

    // assert call order
    start();
    equal(step++, 5);

    // call throttle for the second time
    bb.throttle(null, throttler, 100);

    // assert that it is called in the future and not blackholed
    stop();
    setTimeout(function() {
      start();
      equal(step++, 6);
      ok(wasCalled, "Another throttle call with the same function can be executed later");
    }, 110);
  }, 60);

  stop();
  setTimeout(function() {
    wasCalled = false; // reset the flag

    // assert call order
    start();
    equal(step++, 7);

    // call throttle again that time using a string number like time interval
    bb.throttle(null, throttler, "100");

    // assert that it is called in the future and not blackholed
    stop();
    setTimeout(function() {
      start();
      equal(step++, 8);
      ok(wasCalled, "Throttle accept a string number like time interval");
    }, 110);
  }, 180);
});

test("throttle returns timer information usable for cancelling", function() {
  expect(3);

  var bb = new Backburner(['batman']),
      timer;

  var wasCalled = false;

  function throttler() {
    ok(false, "this method shouldn't be called");
    wasCalled = true;
  }

  timer = bb.throttle(null, throttler, 1);

  ok(bb.cancel(timer), "the timer is cancelled");

  //should return false second time around
  ok(!bb.cancel(timer), "the timer no longer exists in the list");

  stop();
  setTimeout(function() {
    start();
    ok(!wasCalled, "the timer wasn't called after waiting");
  }, 60);

});

test("throttler cancel after it's executed returns false", function() {
  expect(3);

  var bb = new Backburner(['darkknight']),
      timer;

  var wasCalled = false;

  function throttler() {
    ok(true, "the throttled method was called");
    wasCalled = true;
  }

  timer = bb.throttle(null, throttler, 1);

  stop();
  setTimeout(function() {
    start();
    ok(!bb.cancel(timer), "no timer existed to cancel");
    ok(wasCalled, "the timer was actually called");
  }, 10);

});

test("throttler returns the appropriate timer to cancel if the old item still exists", function() {
  expect(5);

  var bb = new Backburner(['robin']),
      timer,
      timer2;

  var wasCalled = false;

  function throttler() {
    ok(true, "the throttled method was called");
    wasCalled = true;
  }

  timer = bb.throttle(null, throttler, 1);
  timer2 = bb.throttle(null, throttler, 1);
  deepEqual(timer, timer2, "the same timer was returned");

  stop();
  setTimeout(function() {
    start();
    bb.throttle(null, throttler, 1);
    ok(!bb.cancel(timer), "the second timer isn't removed, despite appearing to be the same item");
    ok(wasCalled, "the timer was actually called");
  }, 10);

});
