export default function binarySearch(time, timers) {
    var start = 0;
    var end = timers.length - 2;
    var middle, l;
    while (start < end) {
        l = (end - start) / 2;
        middle = start + l - (l % 2);
        if (time >= timers[middle]) {
            start = middle + 2;
        }
        else {
            end = middle;
        }
    }
    return (time >= timers[start]) ? start + 2 : start;
}
