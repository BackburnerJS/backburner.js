import Backburner from "backburner";

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

