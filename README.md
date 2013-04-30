# backburner.js

A rewrite of the Ember.js run loop as a generic microlibrary.

More details soon... until then, look at [the source](https://github.com/ebryn/backburner.js/blob/master/lib/backburner.js) and [the tests](https://github.com/ebryn/backburner.js/blob/master/test/tests/backburner_test.js).

## Example usage

The following code will only cause a single DOM manipulation:

```javascript
var backburner = new Backburner(['render']),
    person = {name: "Erik"};

function updateName() {
  backburner.scheduleOnce('render', function() {
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