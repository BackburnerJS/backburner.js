var Backburner = require('../../dist/backburner').default;

function sharedSetup() {
  var backburner = new this.Backburner(["sync", "actions", "routerTransitions", "render", "afterRender", "destroy", "rsvpAfter"]);

  var target = {
    someMethod: function() { },
    anotherMethod: function() { }
  };

  var timer1 = null;
  var timer2 = null;
}

module.exports = [
  {
    name: 'Throttle - function',

    Backburner: Backburner,

    setup: sharedSetup,

    fn: function() {
      backburner.throttle(target.someMethod, 50);
      backburner.throttle(target.anotherMethod, 100);
      timer1 = backburner.throttle(target.someMethod, 50);
      timer2 = backburner.throttle(target.anotherMethod, 100);
    },

    teardown: function() {
      backburner.cancel(timer1);
      backburner.cancel(timer2);
      timer1 = null
      timer2 = null
    }
  },
  {
    name: 'Throttle & Cancel - function, target',

    Backburner: Backburner,

    setup: sharedSetup,

    fn: function() {
      backburner.throttle(target, 'someMethod', 50);
      backburner.throttle(target, 'anotherMethod', 100);
      timer1 = backburner.throttle(target, 'someMethod', 50);
      timer2 = backburner.throttle(target, 'anotherMethod', 100);

      backburner.cancel(timer1);
      backburner.cancel(timer2);
    },

    teardown: function() {
      timer1 = null
      timer2 = null
    }
  }
];
