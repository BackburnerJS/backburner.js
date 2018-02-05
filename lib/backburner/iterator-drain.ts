// accepts a function that when invoked will return an iterator
// iterator will drain until completion
export interface Iterable {
  next: () => { done: boolean, value?: any };
}

export default function(fn: () => Iterable) {
  let iterator = fn();
  let result = iterator.next();

  while (result.done === false) {
    result.value();
    result = iterator.next();
  }
}
