var Backburner = require('../../dist/backburner').default;

function sharedSetup() {
  var backburner = new this.Backburner(["sync", "actions", "routerTransitions", "render", "afterRender", "destroy", "rsvpAfter"]);

  var target = {
    someMethod: function() { }
  };
}

module.exports = [{
  name: 'Schedule & Cancel - function',

  Backburner: Backburner,

  setup: sharedSetup,

  fn: function() {
    var timer = backburner.schedule('render', function() {
      // no body
    });
    backburner.cancel(timer);
  }
}, {
  name: 'Schedule & Cancel - target, function',

  Backburner: Backburner,

  setup: sharedSetup,

  fn: function() {
    var timer = backburner.schedule('render', target, function() {
      // no body
    });
    backburner.cancel(timer);
  }
}, {
  name: 'Schedule & Cancel - target, string method name',

  Backburner: Backburner,

  setup: sharedSetup,

  fn: function() {
    var timer = backburner.schedule('render', target, 'someMethod');
    backburner.cancel(timer);
  }
}, {
  name: 'Schedule & Cancel - target, string method name, 1 argument',

  Backburner: Backburner,

  setup: sharedSetup,

  fn: function() {
    var timer = backburner.schedule('render', target, 'someMethod', 'foo');
    backburner.cancel(timer);
  }
}, {
  name: 'Schedule & Cancel - target, string method name, 2 arguments',

  Backburner: Backburner,

  setup: sharedSetup,

  fn: function() {
    var timer = backburner.schedule('render', target, 'someMethod', 'foo', 'bar');
    backburner.cancel(timer);
  }
}, {
  name: 'Schedule & Cancel - prescheduled, same queue - target, string method name',

  Backburner: Backburner,

  setup: function() {
    var backburner = new this.Backburner(["sync", "actions", "routerTransitions", "render", "afterRender", "destroy", "rsvpAfter"]);

    var target = {
      someMethod: function() { }
    };

    var prescheduleSetupIterations = 100;
    while (prescheduleSetupIterations--) {
      backburner.schedule('render', function() { });
    }
  },

  fn: function() {
    var timer = backburner.schedule('render', target, 'someMethod');
    backburner.cancel(timer);
  }
}, {
  name: 'Schedule & Cancel - prescheduled, separate queue - target, string method name',

  Backburner: Backburner,

  setup: function() {
    var backburner = new this.Backburner(["sync", "actions", "routerTransitions", "render", "afterRender", "destroy", "rsvpAfter"]);

    var target = {
      someMethod: function() { }
    };

    var prescheduleSetupIterations = 100;
    while (prescheduleSetupIterations--) {
      backburner.schedule('actions', function() { });
    }
  },

  fn: function() {
    var timer = backburner.schedule('render', target, 'someMethod');
    backburner.cancel(timer);
  }
}];
