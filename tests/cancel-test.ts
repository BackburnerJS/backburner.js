import Backburner from 'backburner';

QUnit.module('cancel');

test('null', function() {
  // mimic browser behavior: window.clearTimeout(null) -> undefined
  expect(3);
  let bb = new Backburner(['cancel']);
  equal(bb.cancel(), undefined, 'cancel with no arguments should return undefined');
  equal(bb.cancel(null), undefined, 'cancel a null timer should return undefined');
  equal(bb.cancel(undefined), undefined, 'cancel an undefined timer should return undefined');
});

test('deferOnce', function() {
  expect(3);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(function() {
    let timer = bb.deferOnce('one', function() {
      functionWasCalled = true;
    });

    ok(timer, 'Timer object was returned');
    ok(bb.cancel(timer), 'Cancel returned true');
    ok(!functionWasCalled, 'function was not called');
  });
});

test('setTimeout', function() {
  expect(5);

  let called = false;
  let bb = new Backburner(['one'], {
    onBegin: function() {
      called = true;
    }
  });
  let functionWasCalled = false;

  let timer = bb.setTimeout(function() {
    functionWasCalled = true;
  }, 0);

  ok(timer, 'Timer object was returned');
  ok(bb.cancel(timer), 'Cancel returned true');
  ok(!called, 'onBegin was not called');

  stop();
  setTimeout(function () {
    start();
    ok(!functionWasCalled, 'function was not called');
    ok(!called, 'onBegin was not called');
  }, 0);
});

test('setTimeout with multiple pending', function() {
  expect(7);

  let called = false;
  let bb = new Backburner(['one'], {
    onBegin: function () {
      called = true;
    }
  });
  let function1WasCalled = false;
  let function2WasCalled = false;

  let timer1 = bb.setTimeout(function () {
    function1WasCalled = true;
  }, 0);

  let timer2 = bb.setTimeout(function () {
    function2WasCalled = true;
  }, 1);

  ok(timer1, 'Timer object 2 was returned');
  ok(bb.cancel(timer1), 'Cancel for timer 1 returned true');
  ok(timer2, 'Timer object 2 was returned');
  ok(!called, 'onBegin was not called');

  stop();
  setTimeout(function () {
    start();

    ok(!function1WasCalled, 'function 1 was not called');
    ok(function2WasCalled, 'function 2 was called');
    ok(called, 'onBegin was called');
  }, 10);
});

test('setTimeout and creating a new setTimeout', function() {
  expect(7);

  let called = false;
  let bb = new Backburner(['one'], {
    onBegin: function () {
      called = true;
    }
  });
  let function1WasCalled = false;
  let function2WasCalled = false;

  let timer1 = bb.setTimeout(function () {
    function1WasCalled = true;
  }, 0);

  ok(timer1, 'Timer object 2 was returned');
  ok(bb.cancel(timer1), 'Cancel for timer 1 returned true');

  let timer2 = bb.setTimeout(function () {
    function2WasCalled = true;
  }, 1);

  ok(timer2, 'Timer object 2 was returned');
  ok(!called, 'onBegin was not called');

  stop();
  setTimeout(function () {
    start();

    ok(!function1WasCalled, 'function 1 was not called');
    ok(function2WasCalled, 'function 2 was called');
    ok(called, 'onBegin was called');
  }, 50);
});

test('cancelTimers', function() {
  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  let timer = bb.setTimeout(function() {
    functionWasCalled = true;
  }, 0);

  ok(timer, 'Timer object was returned');
  ok(bb.hasTimers(), 'bb has scheduled timer');

  bb.cancelTimers();

  ok(!bb.hasTimers(), 'bb has no scheduled timer');
  ok(!functionWasCalled, 'function was not called');
});

test('cancel during flush', function() {
  expect(1);

  let bb = new Backburner(['one']);
  let functionWasCalled = false;

  bb.run(function() {
    let timer1 = bb.deferOnce('one', function() {
      bb.cancel(timer2);
    });

    let timer2 = bb.deferOnce('one', function() {
      functionWasCalled = true;
    });
  });

  ok(!functionWasCalled, 'function was not called');
});

test('with GUID_KEY and target', function() {
  expect(3);

  let obj = {
    ___FOO___: 1
  };

  let bb = new Backburner(['action'], {
    GUID_KEY: '___FOO___'
  });

  let wasCalled = 0;

  function fn () {
    wasCalled++;
  }

  bb.run(function() {
    let timer = bb.scheduleOnce('action', obj, fn);

    equal(wasCalled, 0);

    bb.cancel(timer);

    bb.scheduleOnce('action', obj, fn);

    equal(wasCalled, 0);
  });
  equal(wasCalled, 1);

});

test('with GUID_KEY and a target without meta', function() {
  expect(3);

  let obj = { };

  let bb = new Backburner(['action'], {
    GUID_KEY: '___FOO___'
  });

  let wasCalled = 0;

  function fn () {
    wasCalled++;
  }

  bb.run(function() {
    let timer = bb.scheduleOnce('action', obj, fn);

    equal(wasCalled, 0);

    bb.cancel(timer);

    bb.scheduleOnce('action', obj, fn);

    equal(wasCalled, 0);
  });
  equal(wasCalled, 1);

});

test('with GUID_KEY no target', function() {
  expect(3);

  let bb = new Backburner(['action'], {
    GUID_KEY: '___FOO___'
  });

  let wasCalled = 0;

  function fn () {
    wasCalled++;
  }

  bb.run(function() {
    let timer = bb.scheduleOnce('action', fn);

    equal(wasCalled, 0);

    bb.cancel(timer);

    bb.scheduleOnce('action', fn);

    equal(wasCalled, 0);
  });
  equal(wasCalled, 1);

});
