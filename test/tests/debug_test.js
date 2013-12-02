import { Backburner } from "backburner";

module("debug");

test("DEBUG flag enables stack tagging", function() {
  var bb = new Backburner(['one']);

  bb.defer('one', function() {});

  ok(!bb.currentInstance.queues.one._queue[3], "No stack is recorded");

  bb.DEBUG = true;

  bb.defer('one', function() {});

  if (new Error().stack) { // workaround for CLI runner :(
    ok(typeof bb.currentInstance.queues.one._queue[7] === 'string', "A stack is recorded");
  }
});
