import bench from "do-you-even-bench";
import Benchmark from "benchmark";
window.Benchmark = Benchmark;

import DebounceCancel from "./benches/debounce-cancel";
import LaterCancel from "./benches/later-cancel";
import ScheduleCancel from "./benches/schedule-cancel";
import ScheduleFlush from "./benches/schedule-flush";
import ThrottleCancel from "./benches/throttle-cancel";

let suites = [
  DebounceCancel,
  LaterCancel,
  ScheduleCancel,
  ScheduleFlush,
  ThrottleCancel,
].flat();

const searchParams = new URLSearchParams(window.location.search);
const filter = searchParams.get("filter");

if (filter) {
  document.querySelector("input[name=filter]").value = filter;
  suites = suites.filter((s) =>
    s.name.toLowerCase().includes(filter.toLowerCase())
  );
}

bench(suites);
