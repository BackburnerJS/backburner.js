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
    name: 'Debounce - function',

    Backburner: Backburner,

    setup: sharedSetup,

    fn: function() {
      backburner.debounce(target.someMethod, 50);
      backburner.debounce(target.anotherMethod, 100);
      timer1 = backburner.debounce(target.someMethod, 50);
      timer2 = backburner.debounce(target.anotherMethod, 100);
    },

    teardown: function() {
      backburner.cancel(timer1);
      backburner.cancel(timer2);
    }
  },
  {
    name: 'Debounce & Cancel - function, target',

    Backburner: Backburner,

    setup: sharedSetup,

    fn: function() {
      backburner.debounce(target, 'someMethod', 50);
      backburner.debounce(target, 'anotherMethod', 100);
      timer1 = backburner.debounce(target, 'someMethod', 50);
      timer2 = backburner.debounce(target, 'anotherMethod', 100);

      backburner.cancel(timer1);
      backburner.cancel(timer2);
    },

    teardown: function() {
      timer1 = null
      timer2 = null
    }
  }
];
