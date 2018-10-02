
export interface IQueueItem {
  method: string;
  target: Object;
  args: Object[];
  stack: string | undefined;
}
