export interface IPlatform {
  setTimeout(fn: Function, ms: number): any;
  clearTimeout(id: any): void;
  next(): any;
  clearNext(timerId: any): void;
  now(): number;
}

const SET_TIMEOUT = setTimeout;
const NOOP = () => {};

export function buildPlatform(flush: () => void): IPlatform {
  let next;
  let clearNext = NOOP;

  if (typeof MutationObserver === 'function') {
    let iterations = 0;
    let observer = new MutationObserver(flush);
    let node = document.createTextNode('');
    observer.observe(node, { characterData: true });

    next = () => {
      iterations = ++iterations % 2;
      node.data = '' + iterations;
      return iterations;
    };

  } else if (typeof Promise === 'function') {
    const autorunPromise = Promise.resolve();
    next = () => autorunPromise.then(flush);

  } else {
    next = () => SET_TIMEOUT(flush, 0);
  }

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

    next,
    clearNext,
  };
}
