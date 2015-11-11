# backburner.js [![Build Status](https://travis-ci.org/ebryn/backburner.js.png?branch=master)](https://travis-ci.org/ebryn/backburner.js)
A rewrite of the Ember.js run loop as a generic microlibrary.


## Downloads

* master: [globals](http://builds.emberjs.com.s3.amazonaws.com/backburner.js/lastest/backburner.js), [AMD](http://builds.emberjs.com.s3.amazonaws.com/backburner.js/lastest/backburner.amd.js)


## API

### Constructor

`new Backburner([queue names], options)` - instantiate a Backburner instance with an array of queue names

### options

`yieldInterval` - [integer] sets a time interval for task yielding. Omitting or setting to zero instructs backburner to flush all queues without stopping until all taskes have been processed. This is the fastest way to process your app's tasks, however, this approach can lead to Jank in the UI if it takes longer than say >50ms for your app's tasks to run. Assinging a value between 10 and 100 will substantially reduce Jank in your app by creating pauses in task processing which allows the browser to run it's normal paint cycle.  The flip side is that it will increase the time it takes for all your app's tasks to be processed (paint time can add up).


### Instance methods

`Backburner#run` - execute the passed function and flush any deferred actions

`Backburner#defer` - defer the passed function to run inside the specified queue

`Backburner#deferOnce` - defer the passed function to run inside the specified queue, only execute it once

`Backburner#setTimeout` - execute the passed function in a specified amount of time

`Backburner#debounce` - execute the passed function in a specified amount of time, reset timer upon additional calls

`Backburner#throttle` - rate-limit the passed function for a specified amount of time

`Backburner#cancel` - cancel a `deferOnce`, `setTimeout`, `debounce` or `throttle`

`Backburner#on` - Add an event callback. Supports the following events:

* `begin` - Fires whenever the runloop begins. Callbacks are passed the current instance and the previous instance.
* `end` - Fires whenever the runloop ends. Callbacks are passed the current instance and the next instance.

`Backburner#off` - Removes an event callback

`Backburner#join` - Join the passed method with an existing queue and execute immediately, if there isn't one use `Backburner#run`.

#### Alias

`Backburner#schedule` - same as `defer`

`Backburner#scheduleOnce` - same as `deferOnce`

`Backburner#later` - same as `setTimeout`

## Example usage

The following code will only cause a single DOM manipulation:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Backburner demo</title>
  </head>
  <body>

   <div id="name"></div>

    <script src="//code.jquery.com/jquery-2.1.1.min.js"></script>
    <script src="backburner.js"></script>

    <script>
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
    </script>
  </body>
</html>
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
