import Callsite from '@ulixee/commons/lib/Callsite';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';

const AwaitedDomPath = require
  .resolve('@ulixee/awaited-dom/package.json')
  .replace('package.json', '');
const HeroLibPath = require.resolve('./Hero').replace(/\/Hero\.(?:ts|js)/, '');

export default class CallsiteLocator {
  public static readonly ignoreModulePaths = ['node:internal', AwaitedDomPath, HeroLibPath];

  constructor(
    readonly entrypoint: string = Callsite.getEntrypoint(),
  ) {}

  public getCurrent(): ISourceCodeLocation[] {
    const stack = Callsite.getSourceCodeLocation(module.filename);

    let stackLines: ISourceCodeLocation[] = [];
    let lastIndexOfEntrypoint = -1;
    for (const callsite of stack) {
      const { filename } = callsite;
      if (!filename) continue;

      if (CallsiteLocator.ignoreModulePaths.find(x => filename.startsWith(x))) {
        continue;
      }
      if (filename.endsWith(this.entrypoint)) {
        lastIndexOfEntrypoint = stackLines.length;
      }

      stackLines.push(callsite);
    }

    if (lastIndexOfEntrypoint >= 0) stackLines = stackLines.slice(0, lastIndexOfEntrypoint + 1);

    return stackLines;
  }
}
