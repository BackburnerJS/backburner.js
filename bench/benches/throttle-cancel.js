var Backburner = require('../../dist/backburner');

function sharedSetup() {
  var backburner = new this.Backburner(["sync", "actions", "routerTransitions", "render", "afterRender", "destroy", "rsvpAfter"]);

  var target = {
    someMethod: function() { }
  };
}

module.exports = [
  {
    name: 'Throttle & Cancel - function',

    Backburner: Backburner,

    setup: sharedSetup,

    fn: function() {
      var timer = backburner.throttle(null, target.someMethod, 50);
      backburner.cancel(timer);
    }
  },
  {
    name: 'Throttle & Cancel - function, target',

    Backburner: Backburner,

    setup: sharedSetup,

    fn: function() {
      var timer = backburner.throttle(target, 'someMethod', 50);
      backburner.cancel(timer);
    }
  }
];
