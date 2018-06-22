import { TIMERS_OFFSET } from './utils';

export default function binarySearch(time, timers) {
  let start = 0;
  let end = timers.length - TIMERS_OFFSET;
  let middle;
  let l;

  while (start < end) {
    // since timers is an array of pairs 'l' will always
    // be an integer
    l = (end - start) / TIMERS_OFFSET;

    // compensate for the index in case even number
    // of pairs inside timers
    middle = start + l - (l % TIMERS_OFFSET);

    if (time >= timers[middle]) {
      start = middle + TIMERS_OFFSET;
    } else {
      end = middle;
    }
  }

  return (time >= timers[start]) ? start + TIMERS_OFFSET : start;
}
