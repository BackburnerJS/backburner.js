
const ERROR = Error;
// @ts-ignore - Skip preventing overriding the readonly Error object
Error = ERROR;
let stack: string[] = [];

export function pushStackTrace(stackLine: string) {
  stack.push(stackLine);

  return stackLine;
}

export function overrideError(_Error = ERROR) {
  // @ts-ignore
  Error = _Error;
}

export default class MockStableError {
  constructor(public message: string) {}

  get stack(): string {
    return stack.pop() || '';
  }
}
