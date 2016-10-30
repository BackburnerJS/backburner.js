var Backburner = require('../../dist/backburner');

var backburner = new Backburner(["sync", "actions", "routerTransitions", "render", "afterRender", "destroy", "rsvpAfter"]);

module.exports = [{
  name: 'Cancel - no timer',

  fn: function() {
    backburner.cancel(null);
  }
}];
