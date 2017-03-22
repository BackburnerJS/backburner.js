// accepts a function that when invoked will return an iterator
// iterator will drain until completion
export default function(fn: () => { next: () => { done: Boolean, value?: any}}) {
  let iterator = fn();
  let result = iterator.next();

  while (result.done === false) {
    result.value();
    result = iterator.next();
  }
}
