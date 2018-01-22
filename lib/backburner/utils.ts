const NUMBER = /\d+/;

export function isCoercableNumber(suspect) {
  let type = typeof suspect;
  return type === 'number' && suspect === suspect || type === 'string' && NUMBER.test(suspect);
}

export function getOnError(options) {
  return options.onError || (options.onErrorTarget && options.onErrorTarget[options.onErrorMethod]);
}

export function findItem(target, method, collection) {
  let index = -1;

  for (let i = 0, l = collection.length; i < l; i += 4) {
    if (collection[i] === target && collection[i + 1] === method) {
      index = i;
      break;
    }
  }

  return index;
}

export function findTimerItem(target, method, collection) {
  let index = -1;

  for (let i = 2, l = collection.length; i < l; i += 7) {
    if (collection[i] === target && collection[i + 1] === method) {
      index = i - 2;
      break;
    }
  }

  return index;
}
