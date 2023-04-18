import ISourceCodeLocation from '../interfaces/ISourceCodeLocation';

export default class Callsite {
  static getEntrypoint(): string {
    return process.env.ULX_INJECTED_CALLSITE ?? require.main?.filename ?? process.argv[1];
  }

  static getSourceCodeLocation(
    priorToFilename?: string,
    endFilename?: string,
  ): ISourceCodeLocation[] {
    const startingPrepareStack = Error.prepareStackTrace;
    const startingTraceLimit = Error.stackTraceLimit;

    Error.stackTraceLimit = 25;
    Error.prepareStackTrace = this.customStacktrace;

    const capture: { stack?: ISourceCodeLocation[] } = {};
    Error.captureStackTrace(capture);
    Error.stackTraceLimit = startingTraceLimit;
    let stack = capture.stack;

    Error.prepareStackTrace = startingPrepareStack;
    let startIndex = 1;

    if (priorToFilename) {
      const idx = stack.findIndex(
        x => x.filename === priorToFilename || x.filename?.endsWith(priorToFilename),
      );
      if (idx >= 0) startIndex = idx + 1;
    }
    stack = stack.slice(startIndex);


    if (endFilename) {
      let lastIdx = -1;
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        const x = stack[i];
        if (x.filename === endFilename || x.filename?.endsWith(endFilename)) {
          lastIdx = i;
          break;
        }
      }
      if (lastIdx >= 0) stack = stack.slice(0, lastIdx + 1);
    }
    return stack.filter(
      x =>
        !!x.filename &&
        !x.filename.startsWith('internal') &&
        !x.filename.startsWith('node:internal'),
    );
  }

  private static customStacktrace(_: Error, callsite: NodeJS.CallSite[]): ISourceCodeLocation[] {
    return callsite.map(x => ({
      filename: x.getFileName(),
      line: x.getLineNumber(),
      column: x.getColumnNumber() - 1,
    }));
  }
}
