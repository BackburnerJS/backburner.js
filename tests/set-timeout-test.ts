import Backburner from 'backburner';

let originalDateNow = Date.now;
let originalDateValueOf = Date.prototype.valueOf;

QUnit.module('setTimeout', {
  teardown: function(){
    Date.now = originalDateNow;
    Date.prototype.valueOf = originalDateValueOf;
  }
});

test('setTimeout', function() {
  expect(6);

  let bb = new Backburner(['one']);
  let step = 0;
  let instance;

  // Force +new Date to return the same result while scheduling
  // run.later timers. Otherwise: non-determinism!
  let now = +new Date();
  Date.prototype.valueOf = function() { return now; };

  stop();
  bb.setTimeout(null, () => {
    start();
    instance = bb.currentInstance;
    equal(step++, 0);
  }, 10);

  bb.setTimeout(null, () => {
    equal(step++, 1);
    equal(instance, bb.currentInstance, 'same instance');
  }, 10);

  Date.prototype.valueOf = originalDateValueOf;
  // spin so that when we execute timers (+new Date()) will be greater than the
  // time scheduled above; not a problem in real life as we will never 'wait'
  // 0ms
  while ((+ new Date()) <= now + 10) {};

  stop();
  bb.setTimeout(null, () => {
    start();
    equal(step++, 2);

    stop();
    bb.setTimeout(null, () => {
      start();
      equal(step++, 3);
      ok(true, 'Another later will execute correctly');
    }, 1);
  }, 20);
});

test('setTimeout can continue when `Date.now` is monkey-patched', function() {
  expect(1);

  let arbitraryTime = +new Date();
  let bb = new Backburner(['one']);

  Date.now = function() { return arbitraryTime; };

  stop();
  bb.setTimeout(() => {
    start();
    ok(true);
  }, 1);
});

let bb;
QUnit.module('setTimeout arguments / arity', {
  setup() {
    bb = new Backburner(['one']);
  },
  teardown() {
    bb = undefined;
  }
});

test('[callback]', function(){
  expect(2);
  stop();
  bb.setTimeout(function() {
    start();
    equal(arguments.length, 0);
    ok(true, 'was called');
  });
});

test('[callback, undefined]', function(){
  expect(2);
  stop();
  bb.setTimeout(() => {
    start();
    equal(arguments.length, 1);
    ok(true, 'was called');
  }, undefined);
});

test('[null, callback, undefined]', function(){
  expect(2);
  stop();
  bb.setTimeout(null, function() {
    start();
    equal(arguments.length, 0);
    ok(true, 'was called');
  });
});

test('[null, callback, undefined]', function(){
  expect(2);
  stop();
  bb.setTimeout(null, () => {
    start();
    equal(arguments.length, 1);
    ok(true, 'was called');
  }, undefined);
});

test('[null, callback, null]', function(){
  expect(3);
  stop();
  bb.setTimeout(null, function() {
    start();
    equal(arguments.length, 1);
    equal(arguments[0], null);
    ok(true, 'was called');
  }, null);
});

test('[callback, string, string, string]', function(){
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

test('[null, callback, string, string, string]', function(){
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

test('[null, callback, string, string, string, number]', function(){
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

test('[null, callback, string, string, string, numericString]', function(){
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

test('[obj, string]', function(){
  expect(1);
  stop();
  bb.setTimeout({
    bro() {
      start();
      ok(true, 'was called');
    }
  }, 'bro');
});

test('[obj, string, value]', function(){
  expect(3);
  stop();
  bb.setTimeout({
    bro() {
      start();
      equal(arguments.length, 1);
      equal(arguments[0], 'value');
      ok(true, 'was called');
    }
  }, 'bro', 'value');
});

test('[obj, string, value, number]', function(){
  stop();
  bb.setTimeout({
    bro() {
      start();
      equal(arguments.length, 1);
      equal(arguments[0], 'value');
      ok(true, 'was called');
    }
  }, 'bro', 'value', 1);
});

test('[obj, string, value, numericString]', function(){
  stop();
  bb.setTimeout({
    bro() {
      start();
      equal(arguments.length, 1);
      equal(arguments[0], 'value');
      ok(true, 'was called');
    }
  }, 'bro', 'value', '1');
});

test('onError', function() {
  expect(1);

  function onError(error) {
    equal('test error', error.message);
    start();
  }

  bb = new Backburner(['errors'], { onError: onError });

  bb.setTimeout(() => { throw new Error('test error'); }, 1);

  stop();
});

test('setTimeout doesn\'t trigger twice with earlier setTimeout', function() {
  expect(3);

  bb = new Backburner(['one']);
  let called1 = 0;
  let called2 = 0;
  let calls = 0;
  let oldRun = bb.run;

  // Count run() calls and relay them to original function
  bb.run = function () {
    calls++;
    oldRun.apply(bb, arguments);
  };

  bb.setTimeout(() => {
    called1++;
  }, 50);

  bb.setTimeout(() => {
    called2++;
  }, 10);

  stop();
  setTimeout(() => {
    start();
    equal(called1, 1, 'timeout 1 was called once');
    equal(called2, 1, 'timeout 2 was called once');
    equal(calls, 2, 'run() was called twice');
  }, 100);
});

test('setTimeout with two Backburner instances', function() {
  expect(8);

  let steps = 0;
  let bb1 = new Backburner(['one'], {
    onBegin() {
      equal(++steps, 4);
    }
  });
  let bb2 = new Backburner(['one'], {
    onBegin() {
      equal(++steps, 6);
    }
  });

  equal(++steps, 1);

  bb1.setTimeout(() => {
    equal(++steps, 5);
  }, 10);

  equal(++steps, 2);

  bb2.setTimeout(() => {
    equal(++steps, 7);
  }, 10);

  equal(++steps, 3);

  stop();
  setTimeout(() => {
    start();
    equal(++steps, 8);
  }, 50);
});

test('expired timeout doesn\'t hang when setting a new timeout', function() {
  expect(3);

  let called1At = 0;
  let called2At = 0;

  bb.setTimeout(() => {
    called1At = Date.now();
  }, 1);

  // Block JS to simulate https://github.com/ebryn/backburner.js/issues/135
  let waitUntil = Date.now() + 5;
  while (Date.now() < waitUntil) {}

  bb.setTimeout(() => {
    called2At = Date.now();
  }, 50);

  stop();
  setTimeout(() => {
    start();
    ok(called1At !== 0, 'timeout 1 was called');
    ok(called2At !== 0, 'timeout 2 was called');
    ok(called2At - called1At > 10, 'timeout 1 did not wait for timeout 2');
  }, 60);
});

test('NaN timeout doesn\'t hang other timeouts', function() {
  expect(2);

  let called1At = 0;
  let called2At = 0;

  bb.setTimeout(() => {
    called1At = Date.now();
  }, 1);

  bb.setTimeout(() => {}, NaN);

  bb.setTimeout(() => {
    called2At = Date.now();
  }, 10);

  stop();
  setTimeout(() => {
    start();
    ok(called1At !== 0, 'timeout 1 was called');
    ok(called2At !== 0, 'timeout 2 was called');
  }, 20);
});
