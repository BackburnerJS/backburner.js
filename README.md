# backburner.js [![Build Status](https://travis-ci.org/ebryn/backburner.js.png?branch=master)](https://travis-ci.org/ebryn/backburner.js)

A rewrite of the Ember.js run loop as a generic microlibrary.

More details soon... until then, look at [the source](https://github.com/ebryn/backburner.js/blob/master/lib/backburner.js) and [the tests](https://github.com/ebryn/backburner.js/blob/master/test/tests/backburner_test.js).

## API

### Constructor

`new Backburner()` - instantiate a Backburner instance with an array of queue names

### Instance methods

`Backburner#run` - execute the passed function and flush any deferred actions

`Backburner#defer` - defer the passed function to run inside the specified queue

`Backburner#deferOnce` - defer the passed function to run inside the specified queue, only execute it once

`Backburner#setTimeout` - execute the passed function in a specified amount of time

`Backburner#debounce` - execute the passed function in a specified amount of time, reset timer upon additional calls

`Backburner#cancel` - cancel a `deferOnce` or `setTimeout`

## Example usage

The following code will only cause a single DOM manipulation:

```javascript
var backburner = new Backburner(['render']),
    person = {name: "Erik"};

function updateName() {
  backburner.deferOnce('render', function() {
    $('#name').text(person.name);
  });
}

function setName(name) {
  person.name = name;
  updateName();
}

backburner.run(function() {
  setName("Kris");
  setName("Tom");
  setName("Yehuda");
});
```

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/ebryn/backburner.js/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
