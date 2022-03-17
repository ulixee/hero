import { nanoid } from 'nanoid';
import IScriptInstanceMeta from '@ulixee/hero-interfaces/IScriptInstanceMeta';
import { getCallSite } from '@ulixee/commons/lib/utils';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';

const AwaitedDomPath = require.resolve('awaited-dom/package.json').replace('package.json', '');
const HeroLibPath = require.resolve('./Hero').replace(/\/Hero\.(?:ts|js)/, '');

export default class ScriptInstance {
  public readonly ignoreModulePaths = ['node:internal', AwaitedDomPath, HeroLibPath];
  public readonly id: string = nanoid();
  public readonly entrypoint = require.main?.filename ?? process.argv[1];
  public readonly startDate = Date.now();
  public readonly mode: ISessionCreateOptions['mode'];

  private sessionNameCountByName: { [name: string]: number } = {};

  constructor() {
    this.mode = process.env.NODE_ENV as any;
    if (
      !['development', 'production', 'multiverse', 'timetravel', 'browserless'].includes(this.mode)
    ) {
      this.mode = 'development';
    }
  }

  public get meta(): IScriptInstanceMeta {
    return {
      id: this.id,
      workingDirectory: process.cwd(),
      entrypoint: this.entrypoint,
      startDate: this.startDate,
    };
  }

  public generateSessionName(name: string, shouldCleanName = true): string {
    if (name && shouldCleanName) {
      name = cleanupSessionName(name);
    }
    name = name || 'default-session';

    this.sessionNameCountByName[name] = this.sessionNameCountByName[name] || 0;
    const countPlusOne = this.sessionNameCountByName[name] + 1;
    if (countPlusOne > 1) {
      const newName = `${name}-${countPlusOne}`;
      if (this.sessionNameCountByName[newName]) {
        return this.generateSessionName(newName, false);
      }
      this.sessionNameCountByName[name] += 1;
      return newName;
    }
    this.sessionNameCountByName[name] += 1;
    return name;
  }

  public getScriptCallsite(): ISourceCodeLocation[] {
    const stack = getCallSite(module.filename);

    let stackLines: ISourceCodeLocation[] = [];
    let lastIndexOfEntrypoint = -1;
    for (const callsite of stack) {
      const { filename } = callsite;
      if (!filename) continue;

      if (this.ignoreModulePaths.find(x => filename.startsWith(x))) {
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

function cleanupSessionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/--/g, '')
    .replace(/^-|-$/g, '');
}
