import Backburner from 'backburner';

var bb;

module('rollover', {
  setup: function() {
    bb = new Backburner(['one']);
  }
});

test('event queued in rollover happens before immediate run', function() {
  expect(3);
  var callNumber = 0;

  var funcOne = function() {
    equal(callNumber++, 0);
  }

  var funcTwo = function() {
    equal(callNumber++, 1);
  }

  bb.rollover(funcOne);
  bb.run(function() {
    bb.schedule('one', null, funcTwo);
  });

  equal(callNumber++, 2);
});

test('event queued in rollover happens before autorun run', function() {
  expect(3);
  var callNumber = 0;

  var funcOne = function() {
    equal(callNumber++, 1);
  }

  var funcTwo = function() {
    equal(callNumber++, 2);
    start();
  }

  bb.rollover(funcOne);

  equal(callNumber++, 0);

  bb.schedule('one', null, funcTwo);

  stop();
});

test('event queued in rollover happens', function() {
  expect(2);
  var callNumber = 0;

  var funcOne = function() {
    equal(callNumber++, 1);
    start();
  }

  bb.rollover(funcOne);

  equal(callNumber++, 0);

  stop();
});
