# backburner.js [![Build Status](https://travis-ci.org/ebryn/backburner.js.png?branch=master)](https://travis-ci.org/ebryn/backburner.js)
A rewrite of the Ember.js run loop as a generic microlibrary.


## Downloads

* master: [globals](http://builds.emberjs.com.s3.amazonaws.com/backburner.js/lastest/backburner.js), [AMD](http://builds.emberjs.com.s3.amazonaws.com/backburner.js/lastest/backburner.amd.js)


## API

### Constructor

`new Backburner()` - instantiate a Backburner instance with an array of queue names

### Instance methods

`Backburner#run` - execute the passed function and flush any deferred actions

`Backburner#defer` - defer the passed function to run inside the specified queue

`Backburner#deferOnce` - defer the passed function to run inside the specified queue, only execute it once

`Backburner#setTimeout` - execute the passed function in a specified amount of time

`Backburner#debounce` - execute the passed function in a specified amount of time, reset timer upon additional calls

`Backburner#throttle` - rate-limit the passed function for a specified amount of time

`Backburner#cancel` - cancel a `deferOnce`, `setTimeout`, `debounce` or `throttle`

## Example usage

The following code will only cause a single DOM manipulation:

```javascript
var backburner = new Backburner(['render']),
    person = {name: "Erik"};

function updateName() {
  $('#name').text(person.name);
}

function setName(name) {
  person.name = name;
  backburner.deferOnce('render', updateName);
}

backburner.run(function() {
  setName("Kris");
  setName("Tom");
  setName("Yehuda");
});
```

## Simple Backbone Example

```javascript
app.TodoView = Backbone.View.extend({
  // ...

  initialize: function () {
    this.listenTo(this.model, 'change', this.render);
  },

  render: function() {
    // put the rerender on the backburner!
    backburner.deferOnce('render', this, this.actuallyRender);
  },

  actuallyRender: function() {
    // do our DOM manipulations here. will only be called once.
  }

  // ...
});


// ... somewhere in our app code ...
backburner.run(function() {
  model.set('firstName', 'Erik');
  model.set('lastName',  'Bryn');
});

// our view has been rerendered only once, thanks to backburner!

```

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/ebryn/backburner.js/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
![](https://d3oi6fmp1dfbdb.cloudfront.net/g.gif?repo=ebryn/backburner.js)
