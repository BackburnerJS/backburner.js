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
