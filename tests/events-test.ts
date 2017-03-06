import Backburner from 'backburner';

QUnit.module('Events');

test('end event should fire after runloop completes', function() {
  expect(3);
  var callNumber = 0;

  var bb = new Backburner(['one', 'two']);

  bb.on('end', function() {
    callNumber++;
  });

  var funcOne = function() {
    equal(callNumber, 0);
  }

  var funcTwo = function() {
    equal(callNumber, 0);
  }

  bb.run(function() {
    bb.schedule('one', null, funcOne);
    bb.schedule('two', null, funcTwo);
  });

  equal(callNumber, 1);
});

test('end event should fire before onEnd', function() {
  expect(3);
  var callNumber = 0;

  var bb = new Backburner(['one', 'two'], {
    onEnd: function() {
      equal(callNumber, 1);
    }
  });

  bb.on('end', function() {
    callNumber++;
  });

  var funcOne = function() {
    equal(callNumber, 0);
  }

  var funcTwo = function() {
    equal(callNumber, 0);
  }

  bb.run(function() {
    bb.schedule('one', null, funcOne);
    bb.schedule('two', null, funcTwo);
  });
});

test('end event should be passed the current and next instance', function() {
  expect(4);
  var callNumber = 0;

  var firstArgument = null;
  var secondArgument = null;

  var bb = new Backburner(['one'], {
    onEnd: function(first, second) {
      equal(firstArgument, first);
      equal(secondArgument, second);
    }
  });

  bb.on('end', function(first, second) {
    firstArgument = first;
    secondArgument = second;
  });

  bb.run(function() {
    bb.schedule('one', null, function() {});
  });

  bb.run(function() {
    bb.schedule('one', null, function() {});
  });
});
//blah

test('begin event should fire before runloop begins', function() {
  expect(4);
  var callNumber = 0;

  var bb = new Backburner(['one', 'two']);

  bb.on('begin', function() {
    callNumber++;
  });

  var funcOne = function() {
    equal(callNumber, 1);
  }

  var funcTwo = function() {
    equal(callNumber, 1);
  }

  equal(callNumber, 0);
  bb.run(function() {
    bb.schedule('one', null, funcOne);
    bb.schedule('two', null, funcTwo);
  });

  equal(callNumber, 1);
});

test('begin event should fire before onBegin', function() {
  expect(1);
  var callNumber = 0;

  var bb = new Backburner(['one', 'two'], {
    onBegin: function() {
      equal(callNumber, 1);
    }
  });

  bb.on('begin', function() {
    callNumber++;
  });

  bb.run(function() {
    bb.schedule('one', null, function() {});
    bb.schedule('two', null, function() {});
  });
});

test('begin event should be passed the current and previous instance', function() {
  expect(4);
  var callNumber = 0;

  var firstArgument = null;
  var secondArgument = null;

  var bb = new Backburner(['one'], {
    onBegin: function(first, second) {
      equal(firstArgument, first);
      equal(secondArgument, second);
    }
  });

  bb.on('begin', function(first, second) {
    firstArgument = first;
    secondArgument = second;
  });

  bb.run(function() {
    bb.schedule('one', null, function() {});
  });

  bb.run(function() {
    bb.schedule('one', null, function() {});
  });
});

//blah
test('events should work with multiple callbacks', function() {
  expect(2);
  var firstCalled = false;
  var secondCalled = false;

  var bb = new Backburner(['one']);

  var first = function() {
    firstCalled = true;
  };

  var second = function() {
    secondCalled = true;
  }

  bb.on('end', first);
  bb.on('end', second);

  bb.run(function() {
    bb.schedule('one', null, function() {});
  });

  equal(secondCalled, true);
  equal(firstCalled, true);
});

test('off should unregister specific callback', function() {
  expect(2);
  var firstCalled = false;
  var secondCalled = false;

  var bb = new Backburner(['one']);

  var first = function() {
    firstCalled = true;
  };

  var second = function() {
    secondCalled = true;
  }

  bb.on('end', first);
  bb.on('end', second);

  bb.off('end', first);

  bb.run(function() {
    bb.schedule('one', null, function() {});
  });

  equal(secondCalled, true);
  equal(firstCalled, false);
});