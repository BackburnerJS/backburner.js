import { IQueueItem } from './interfaces';

type MaybeError = Error | undefined;

const NUMBER = /\d+/;

const enum QueueItemPosition {
  target,
  method,
  args,
  stack
}

export const QUEUE_ITEM_LENGTH = 5;
export const TIMERS_OFFSET = 7;

export function isCoercableNumber(suspect) {
  let type = typeof suspect;
  return type === 'number' && suspect === suspect || type === 'string' && NUMBER.test(suspect);
}

export function getOnError(options) {
  return options.onError || (options.onErrorTarget && options.onErrorTarget[options.onErrorMethod]);
}

export function findItem(target, method, collection) {
  let index = -1;

  for (let i = 0, l = collection.length; i < l; i += QUEUE_ITEM_LENGTH) {
    if (collection[i] === target && collection[i + 1] === method) {
      index = i;
      break;
    }
  }

  return index;
}

export function findTimerItem(target, method, collection) {
  let index = -1;

  for (let i = 2, l = collection.length; i < l; i += TIMERS_OFFSET) {
    if (collection[i] === target && collection[i + 1] === method) {
      index = i - 2;
      break;
    }
  }

  return index;
}

export function getQueueItems(items: any[], queueItemLength: number, queueItemPositionOffset: number = 0): IQueueItem[] {
  let queueItems: IQueueItem[] = [];

  for (let i = 0; i < items.length; i += queueItemLength) {
    let maybeError: MaybeError = items[i + QueueItemPosition.stack + queueItemPositionOffset];
    let queueItem = {
      target: items[i + QueueItemPosition.target + queueItemPositionOffset],
      method: items[i + QueueItemPosition.method + queueItemPositionOffset],
      args: items[i + QueueItemPosition.args + queueItemPositionOffset],
      stack: maybeError !== undefined && 'stack' in maybeError ? maybeError.stack : ''
    };

    queueItems.push(queueItem);
  }

  return queueItems;
}
