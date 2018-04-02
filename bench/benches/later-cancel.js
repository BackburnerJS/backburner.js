var Backburner = require('../../dist/backburner').default;

function sharedSetup() {
  var backburner = new this.Backburner(["sync", "actions", "routerTransitions", "render", "afterRender", "destroy", "rsvpAfter"]);

  var target = {
    someMethod: function() { }
  };
}

module.exports = [
  {
    name: 'Later & Cancel - function',

    Backburner: Backburner,

    setup: sharedSetup,

    fn: function() {
      var timer = backburner.later(null, target.someMethod, 100);
      backburner.cancel(timer);
    }
  },
  {
    name: 'Later & Cancel - function, target',

    Backburner: Backburner,

    setup: sharedSetup,

    fn: function() {
      var timer = backburner.later(target, 'someMethod', 100);
      backburner.cancel(timer);
    }
  }
];
