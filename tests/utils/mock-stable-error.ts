
const ERROR = Error;
// @ts-ignore - Skip preventing overriding the readonly Error object
Error = ERROR;
let stacks: string[] = [];

export function pushStackTrace(stackLine: string) {
  stacks.push(stackLine);

  return stackLine;
}

export function overrideError(_Error) {
  // @ts-ignore
  Error = _Error;
}

export function resetError() {
  // @ts-ignore
  Error = ERROR;
  stacks = [];
}

export default class MockStableError {
  constructor(public message: string) {}

  get stack(): string {
    return stacks.pop() || '';
  }
}
