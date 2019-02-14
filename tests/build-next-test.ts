import Backburner from 'backburner';

QUnit.module('tests/build-next', function() {

  QUnit.test('can build custom flushing next', function(assert) {
    let done = assert.async();
    let next = Backburner.buildNext(() => assert.step('custom next'));

    assert.step('start');
    Promise.resolve().then(() => assert.step('first promise resolved'));
    next();
    Promise.resolve().then(() => assert.step('second promise resolved'));
    assert.step('end');

    setTimeout(() => {
      assert.verifySteps([
        'start',
        'end',
        'first promise resolved',
        'custom next',
        'second promise resolved',
      ]);
      done();
    }, 10);
  });
});
