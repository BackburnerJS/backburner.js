import Backburner from 'backburner';

var bb;

module('Ensure end before autorun', {
  setup() {
    bb = new Backburner(
      ['one', 'two'],
      {ensureEndBeforeAutorun: true}
    );
  }
});

test('event queued in autorun happens before immediate run', function() {
  expect(3);
  var callNumber = 0;

  var funcOne = function() {
    equal(callNumber++, 0);
  }

  var funcTwo = function() {
    equal(callNumber++, 1);
  }

  bb.schedule('one', null, funcOne);
  bb.run(() => {
    bb.schedule('two', null, funcTwo);
  });

  equal(callNumber++, 2);
});
