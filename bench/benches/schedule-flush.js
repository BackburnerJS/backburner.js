var Backburner = require('../../dist/backburner').default;

function prodSetup() {
  var backburner = new this.Backburner(["sync", "actions", "routerTransitions", "render", "afterRender", "destroy", "rsvpAfter"]);

  var target = {
    someMethod: function() { }
  };
}

function debugSetup() {
  var backburner = new this.Backburner(["sync", "actions", "routerTransitions", "render", "afterRender", "destroy", "rsvpAfter"]);
  backburner.DEBUG = true;

  var target = {
    someMethod: function() { }
  };
}

let scenarios = [];

let base = [{
  name: 'Schedule & Flush - function',

  Backburner: Backburner,

  fn: function() {
    backburner.begin();
    backburner.schedule('render', function() {});
    backburner.end();
  }
}, {
  name: 'Schedule & Flush - target, function',

  Backburner: Backburner,

  fn: function() {
    backburner.begin();
    backburner.schedule('render', target, function() {});
    backburner.end();
  }
}, {
  name: 'Schedule & Flush - target, string method name',

  Backburner: Backburner,

  fn: function() {
    backburner.begin();
    backburner.schedule('render', target, 'someMethod');
    backburner.end();
  }
}, {
  name: 'Schedule & Flush - target, string method name, 1 argument',

  Backburner: Backburner,

  fn: function() {
    backburner.begin();
    backburner.schedule('render', target, 'someMethod', 'foo');
    backburner.end();
  }
}, {
  name: 'Schedule & Flush - target, string method name, 2 arguments',

  Backburner: Backburner,

  fn: function() {
    backburner.begin();
    backburner.schedule('render', target, 'someMethod', 'foo', 'bar');
    backburner.end();
  }
}];

base.forEach(item => {
  let prodItem = Object.assign({}, item);
  prodItem.setup = prodSetup;
  scenarios.push(prodItem);
});

base.forEach(item => {
  let debugItem = Object.assign({}, item);
  debugItem.name = `DEBUG - ${debugItem.name}`;
  debugItem.setup = debugSetup;
  scenarios.push(debugItem);
});

module.exports = scenarios;
