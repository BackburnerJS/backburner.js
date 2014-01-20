import { Backburner } from "backburner";

var originalDateValueOf = Date.prototype.valueOf;

module("setTimeout",{
  teardown: function(){
    Date.prototype.valueOf = originalDateValueOf;
  }
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
    equal(step++, 1);
    equal(instance, bb.currentInstance, "same instance");
  }, 10);

  bb.setTimeout(null, function() {
    start();
    instance = bb.currentInstance;
    equal(step++, 0);
  }, 10);

  Date.prototype.valueOf = originalDateValueOf;

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
