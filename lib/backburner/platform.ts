export interface IPlatform {
  setTimeout(fn: Function, ms: number): any;
  clearTimeout(id: any): void;
  next(): any;
  clearNext(): void;
  now(): number;
}

const SET_TIMEOUT = setTimeout;
const NOOP = () => {};

export function buildNext(flush: () => void): () => void {
  // Using "promises first" here to:
  //
  // 1) Ensure more consistent experience on browsers that
  //    have differently queued microtasks (separate queues for
  //    MutationObserver vs Promises).
  // 2) Ensure better debugging experiences (it shows up in Chrome
  //    call stack as "Promise.then (async)") which is more consistent
  //    with user expectations
  //
  // When Promise is unavailable use MutationObserver (mostly so that we
  // still get microtasks on IE11), and when neither MutationObserver and
  // Promise are present use a plain old setTimeout.
  if (typeof Promise === 'function') {
    const autorunPromise = Promise.resolve();

    return () => autorunPromise.then(flush);
  } else if (typeof MutationObserver === 'function') {
    let iterations = 0;
    let observer = new MutationObserver(flush);
    let node = document.createTextNode('');
    observer.observe(node, { characterData: true });

    return () => {
      iterations = ++iterations % 2;
      node.data = '' + iterations;
      return iterations;
    };
  } else {
    return () => SET_TIMEOUT(flush, 0);
  }
}

export function buildPlatform(flush: () => void): IPlatform {
  let clearNext = NOOP;

  return {
    setTimeout(fn, ms) {
      return setTimeout(fn, ms);
    },

    clearTimeout(timerId: number) {
      return clearTimeout(timerId);
    },

    now() {
      return Date.now();
    },

    next: buildNext(flush),
    clearNext,
  };
}
