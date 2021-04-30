# backburner.js [![Build Status](https://travis-ci.org/BackburnerJS/backburner.js.svg?branch=master)](https://travis-ci.org/BackburnerJS/backburner.js)
A rewrite of the Ember.js run loop as a generic microlibrary.

## TL;DR
A priority queue that will efficiently batch, order, reorder and process work; done via scheduling work on specific queues.

## API

### Constructor

|  Constructor | Description  |
|---|---|
| `new Backburner()` | instantiate a Backburner instance with an array of queue names |

### Instance methods

| Method  | Description  |
|---|---|
| `Backburner#run` | execute the passed function and flush any deferred actions |
| `Backburner#defer` | defer the passed function to run inside the specified queue |
| `Backburner#deferOnce` | defer the passed function to run inside the specified queue, only execute it once |
| `Backburner#setTimeout` | execute the passed function in a specified amount of time |
| `Backburner#debounce` | execute the passed function in a specified amount of time, reset timer upon additional calls |
| `Backburner#throttle` | rate-limit the passed function for a specified amount of time |
| `Backburner#cancel` | cancel a `deferOnce`, `setTimeout`, `debounce` or `throttle` |
| `Backburner#on` | Add an event callback. Supports the following events: <br><ul><li>`begin` - Fires whenever the runloop begins. Callbacks are passed the current instance and the previous instance.</li><li>`end` - Fires whenever the runloop ends. Callbacks are passed the current instance and the next instance.</li></ul> |
| `Backburner#off` | Removes an event callback |
| `Backburner#join` | Join the passed method with an existing queue and execute immediately, if there isn't one use `Backburner#run` |
| `Backburner#getDebugInfo` | Returns debug information for counters, timers and queues, which includes surfacing the stack trace information for the respective calls |

#### Alias

| Alias  | Description  |
|---|---|
| `Backburner#schedule` | same as `defer` |
| `Backburner#scheduleOnce` | same as `deferOnce` |
| `Backburner#later` | same as `setTimeout` |

## Example usage

The following code will only cause a single DOM manipulation:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Backburner demo</title>
  </head>

  <body>
    <div id="name"></div>

    <script type="module">
      import Backburner from './dist/es6/backburner.js'

      var backburner = new Backburner(['render']),
        person = {name: 'Erik'};

      function updateName() {
        document.querySelector('#name').innerHTML = person.name;
      }

      function setName(name) {
        person.name = name;
        backburner.deferOnce('render', updateName);
      }

      backburner.run(function() {
        setName('Kris');
        setName('Tom');
        setName('Yehuda');
      });
    </script>
  </body>
</html>
```
