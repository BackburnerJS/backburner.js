var Backburner = require('../../dist/backburner');

function sharedSetup() {
  var backburner = new this.Backburner(["sync", "actions", "routerTransitions", "render", "afterRender", "destroy", "rsvpAfter"]);

  var target = {
    someMethod: function() { }
  };
}

module.exports = [
  {
    name: 'Debounce & Cancel - function',

    Backburner: Backburner,

    setup: sharedSetup,

    fn: function() {
      var timer = backburner.debounce(null, target.someMethod, 50);
      backburner.cancel(timer);
    }
  },
  {
    name: 'Debounce & Cancel - function, target',

    Backburner: Backburner,

    setup: sharedSetup,

    fn: function() {
      var timer = backburner.debounce(target, 'someMethod', 50);
      backburner.cancel(timer);
    }
  }
];
