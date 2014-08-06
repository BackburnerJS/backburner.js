import Backburner from "backburner";

var originalDateValueOf = Date.prototype.valueOf;

module("setTimeout",{
  teardown: function(){
    Date.prototype.valueOf = originalDateValueOf;
  }
});

test("setTimeout", function() {
  expect(6);

  var bb = new Backburner(['one']);
  var step = 0;
  var instance;

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
  // spin so that when we execute timers (+new Date()) will be greater than the
  // time scheduled above; not a problem in real life as we will never "wait"
  // 0ms
  while((+ new Date()) <= now + 10);

  stop();
  bb.setTimeout(null, function() {
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

var bb;
module("setTimeout arguments / arity", {
  setup: function(){
    bb = new Backburner(['one']);
  },
  teardown: function(){
    bb = undefined;
  }
});

test("[callback]", function(){
  expect(2);
   stop();
   bb.setTimeout(function() {
     start();
     equal(arguments.length, 0);
     ok(true, 'was called');
   });
});

test("[callback, undefined]", function(){
  expect(2);
  stop();
  bb.setTimeout(function() {
    start();
    equal(arguments.length, 1);
    ok(true, 'was called');
  }, undefined);
});

test("[null, callback, undefined]", function(){
  expect(2);
  stop();
  bb.setTimeout(null, function() {
    start();
    equal(arguments.length, 0);
    ok(true, 'was called');
  });
});

test("[null, callback, undefined]", function(){
  expect(2);
  stop();
  bb.setTimeout(null, function() {
    start();
    equal(arguments.length, 1);
    ok(true, 'was called');
  }, undefined);
});

test("[null, callback, null]", function(){
  expect(3);
  stop();
  bb.setTimeout(null, function() {
    start();
    equal(arguments.length, 1);
    equal(arguments[0], null);
    ok(true, 'was called');
  }, null);
});

test("[callback, string, string, string]", function(){
  expect(5);
  stop();
  bb.setTimeout(function() {
    start();
    equal(arguments.length, 3);
    equal(arguments[0], 'a');
    equal(arguments[1], 'b');
    equal(arguments[2], 'c');
    ok(true, 'was called');
  }, 'a', 'b', 'c');
});

test("[null, callback, string, string, string]", function(){
  expect(5);
  stop();
  bb.setTimeout(null, function() {
    start();
    equal(arguments.length, 3);
    equal(arguments[0], 'a');
    equal(arguments[1], 'b');
    equal(arguments[2], 'c');
    ok(true, 'was called');
  }, 'a', 'b', 'c');
});

test("[null, callback, string, string, string, number]", function(){
  expect(5);
  stop();
  bb.setTimeout(null, function() {
    start();
    equal(arguments.length, 3);
    equal(arguments[0], 'a');
    equal(arguments[1], 'b');
    equal(arguments[2], 'c');
    ok(true, 'was called');
  }, 'a', 'b', 'c', 10);
});

test("[null, callback, string, string, string, numericString]", function(){
  expect(5);
  stop();
  bb.setTimeout(null, function() {
    start();
    equal(arguments.length, 3);
    equal(arguments[0], 'a');
    equal(arguments[1], 'b');
    equal(arguments[2], 'c');
    ok(true, 'was called');
  },  'a', 'b', 'c', '1');
});

test("[obj, string]", function(){
  expect(1);
  stop();
  bb.setTimeout({
    bro: function(){
      start();
      ok(true, 'was called');
    }
  }, 'bro');
});

test("[obj, string, value]", function(){
  expect(3);
  stop();
  bb.setTimeout({
    bro: function(){
      start();
      equal(arguments.length, 1);
      equal(arguments[0], 'value');
      ok(true, 'was called');
    }
  }, 'bro', 'value');
});

test("[obj, string, value, number]", function(){
  stop();
  bb.setTimeout({
    bro: function(){
      start();
      equal(arguments.length, 1);
      equal(arguments[0], 'value');
      ok(true, 'was called');
    }
  }, 'bro', 'value', 1);
});

test("[obj, string, value, numericString]", function(){
  stop();
  bb.setTimeout({
    bro: function(){
      start();
      equal(arguments.length, 1);
      equal(arguments[0], 'value');
      ok(true, 'was called');
    }
  }, 'bro', 'value', '1');
});

test("onError", function() {
  expect(1);

  function onError(error) {
    equal("test error", error.message);
    start();
  }

  var bb = new Backburner(['errors'], { onError: onError });

  bb.setTimeout(function() { throw new Error("test error"); }, 1);

  stop();
});

test("setTimeout doesn't trigger twice with earlier setTimeout", function() {
  expect(3);

  var bb = new Backburner(['one']);
  var called1 = 0;
  var called2 = 0;
  var calls = 0;
  var oldRun = bb.run;

  // Count run() calls and relay them to original function
  bb.run = function () {
    calls++;
    oldRun.apply(bb, arguments);
  };

  bb.setTimeout(function() {
    called1++;
  }, 50);

  bb.setTimeout(function() {
    called2++;
  }, 10);

  stop();
  setTimeout(function () {
    start();
    equal(called1, 1, "timeout 1 was called once");
    equal(called2, 1, "timeout 2 was called once");
    equal(calls, 2, "run() was called twice");
  }, 100);
});

test("setTimeout doesn't hang when timeout is unfulfilled", function() { // See issue #86
  expect(3);

  var bb = new Backburner(['one']);
  var called1 = 0;
  var called2 = 0;
  var calls = 0;
  var oldRun = bb.run;

  // Count run() calls and relay them to original function
  bb.run = function () {
    calls++;
    oldRun.apply(bb, arguments);
  };

  bb.setTimeout(function() {
    called1++;
  }, 0);

  // Manually pass time and clear timeout
  clearTimeout(bb._laterTimer);
  bb._laterTimerExpiresAt = +(new Date()) - 5000;

  bb.setTimeout(function() {
    called2++;
  }, 10);

  stop();
  setTimeout(function () {
    start();
    equal(called1, 1, "timeout 1 was called once");
    equal(called2, 1, "timeout 2 was called once");
    equal(calls, 1, "run() was called once"); // both at once
  }, 50);
});

test("setTimeout with two Backburner instances", function() {
  expect(8);

  var steps = 0;
  var bb1 = new Backburner(['one'], {
    onBegin: function() {
      equal(++steps, 4);
    }
  });
  var bb2 = new Backburner(['one'], {
    onBegin: function() {
      equal(++steps, 6);
    }
  });

  equal(++steps, 1);

  bb1.setTimeout(function() {
    equal(++steps, 5);
  }, 10);

  equal(++steps, 2);

  bb2.setTimeout(function() {
    equal(++steps, 7);
  }, 10);

  equal(++steps, 3);

  stop();
  setTimeout(function () {
    start();
    equal(++steps, 8);
  }, 50);
});
