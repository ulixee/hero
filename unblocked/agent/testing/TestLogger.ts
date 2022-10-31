import { ILogEntry, translateToPrintable } from '@ulixee/commons/lib/Logger';
import * as Path from 'path';
import * as Fs from 'fs';
import ILog, { IBoundLog, ILogData } from '@ulixee/commons/interfaces/ILog';
import { inspect } from 'util';
import env from './env';

let isDevtoolsLogging = false;
try {
  const envDebug = process.env.DEBUG ?? '';
  if (
    envDebug.includes('ubk:*') ||
    envDebug.includes('ubk*') ||
    envDebug === '*' ||
    envDebug.includes('devtools')
  ) {
    isDevtoolsLogging = true;
  }
} catch (e) {}

const logLevels = { stats: 0, info: 1, warn: 2, error: 3 } as const;
let logId = 0;
export default class TestLogger implements ILog {
  public static testNumber = 0;
  public readonly level = env.isLogDebug ? 'stats' : 'error';

  protected readonly boundContext: any = {};
  private readonly module: string;

  constructor(readonly outPath: string, module: NodeModule, boundContext?: any) {
    this.module = module ? extractPathFromModule(module) : '';
    if (boundContext) this.boundContext = boundContext;
    if (this.module.includes('DevtoolsSessionLogger') && isDevtoolsLogging) {
      this.level = 'stats';
    }
  }

  public stats(action: string, data?: ILogData): number {
    return this.log('stats', action, data);
  }

  public info(action: string, data?: ILogData): number {
    return this.log('info', action, data);
  }

  public warn(action: string, data?: ILogData): number {
    return this.log('warn', action, data);
  }

  public error(action: string, data?: ILogData | { error: Error }): number {
    return this.log('error', action, data);
  }

  public flush(): void {
    // no-op
  }

  public createChild(module: any, boundContext?: any): ILog {
    return new TestLogger(this.outPath, module, boundContext);
  }

  protected log(level: ILogEntry['level'], action: string, data?: ILogData | any): number {
    let logData: object;
    let sessionId: string = this.boundContext.sessionId;
    let parentId: number;
    const mergedData = { ...data, context: this.boundContext };
    if (mergedData) {
      for (const [key, val] of Object.entries(mergedData)) {
        if (key === 'parentLogId') parentId = val as number;
        else if (key === 'sessionId') sessionId = val as string;
        else {
          if (!logData) logData = {};
          logData[key] = val;
        }
      }
    }
    logId += 1;
    const id = logId;
    const timestamp = new Date().toISOString();

    const { error, printData } = translateToPrintable(logData);

    const params = Object.keys(printData).length ? [printData] : [];
    if (error) params.push(error);

    Fs.appendFileSync(
      `${this.outPath}-${TestLogger.testNumber}.jsonl`,
      `${JSON.stringify({
        timestamp,
        level,
        path: this.module,
        action,
        params,
      })}\n`,
    );
    if (logLevels[level] >= logLevels[this.level]) {
      // eslint-disable-next-line no-console
      console.log(
        `${timestamp} ${level.toUpperCase()} [${this.module}] ${action}`,
        ...params.map(x => inspect(x, false, null, env.useLogColors)),
      );
    }
    return id;
  }

  public static forTest(module: NodeModule): IBoundLog {
    const entrypoint = require.main?.filename ?? process.argv[1];
    const path = entrypoint.split(Path.sep);
    const testName = path.slice(-3).join('-').replace('.test.js', '');

    if (!Fs.existsSync(env.dataDir)) Fs.mkdirSync(env.dataDir, { recursive: true });
    return new TestLogger(`${env.dataDir}/${testName}`, module) as IBoundLog;
  }
}

function extractPathFromModule(module: NodeModule): string {
  const fullPath = typeof module === 'string' ? module : module.filename || module.id || '';
  return fullPath
    .replace('.js', '')
    .replace('.ts', '')
    .replace(/^(.*)[/\\]agent[/\\](.+)$/, '$2')
    .replace(/^.*[/\\]build[/\\](.+)$/, '$1');
}
