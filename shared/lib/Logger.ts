// eslint-disable-next-line max-classes-per-file
import { inspect } from 'util';
import ILog, { ILogData } from '../interfaces/ILog';

const hasBeenLoggedSymbol = Symbol.for('hasBeenLogged');

const logFilters = {
  active: [] as RegExp[],
  skip: [] as RegExp[],
  namespaces: { active: new Set<string>(), inactive: new Set<string>() },
  enabledNamesCache: {} as { [namespace: string]: boolean },
};

let logId = 0;
class Log implements ILog {
  public readonly level: LogLevel;
  public useColors =
    process.env.NODE_DISABLE_COLORS !== 'true' && process.env.NODE_DISABLE_COLORS !== '1';

  protected readonly boundContext: any = {};
  private readonly module: string;

  constructor(module: NodeModule, boundContext?: any) {
    this.module = module ? extractPathFromModule(module) : '';
    if (boundContext) this.boundContext = boundContext;
    this.level = isEnabled(this.module) ? 'stats' : 'error';
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

  public error(action: string, data?: ILogData): number {
    return this.log('error', action, data);
  }

  public createChild(module, boundContext?: any): ILog {
    const Constructor = this.constructor;
    // @ts-ignore
    return new Constructor(module, {
      ...this.boundContext,
      ...boundContext,
    });
  }

  public flush(): void {
    // no-op
  }

  protected logToConsole(level: LogLevel, entry: ILogEntry): void {
    const printablePath = entry.module.replace('.js', '').replace('.ts', '').replace('build/', '');

    const { error, printData } = translateToPrintable(entry.data);

    if (level === 'warn' || level === 'error') {
      printData.sessionId = entry.sessionId;
      printData.sessionName = loggerSessionIdNames.get(entry.sessionId) ?? undefined;
    }

    const params = Object.keys(printData).length ? [printData] : [];
    if (error) params.push(error);

    // eslint-disable-next-line no-console
    console.log(
      `${entry.timestamp.toISOString()} ${entry.level.toUpperCase()} [${printablePath}] ${
        entry.action
      }`,
      ...params.map(x => inspect(x, false, null, this.useColors)),
    );
  }

  private log(level: LogLevel, action: string, data?: ILogData): number {
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
    const entry: ILogEntry = {
      id,
      sessionId,
      parentId,
      timestamp: new Date(),
      action,
      data: logData,
      level,
      module: this.module,
    };
    if (logLevels[level] >= logLevels[this.level]) {
      this.logToConsole(level, entry);
    }
    LogEvents.broadcast(entry);
    return id;
  }
}

function translateValueToPrintable(value: any, depth = 0): any {
  if (value === undefined || value === null) return;
  if (value instanceof Error) {
    return value.toString();
  }
  if (value instanceof RegExp) {
    return `/${value.source}/${value.flags}`;
  }
  if ((value as any).toJSON) {
    return (value as any).toJSON();
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (depth > 2) return value;

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(x => translateValueToPrintable(x, depth + 1));
    }
    const result: any = {};
    for (const [key, subValue] of Object.entries(value)) {
      result[key] = translateValueToPrintable(subValue, depth + 1);
    }
    return result;
  }
}

export function translateToPrintable(
  data: any,
  result?: { error?: Error; printData: any },
): { error?: Error; printData: any } {
  result ??= { printData: {} };
  const { printData } = result;
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Error) {
      Object.defineProperty(value, hasBeenLoggedSymbol, {
        enumerable: false,
        value: true,
      });
      result.error = value;
      continue;
    }
    const printable = translateValueToPrintable(value);
    if (printable === null || printable === undefined) continue;
    printData[key] = printable;
  }
  return result;
}

const logLevels = { stats: 0, info: 1, warn: 2, error: 3 };

let logCreator = (module: NodeModule): { log: ILog } => {
  const log: ILog = new Log(module);

  return {
    log,
  };
};

export default function logger(module: NodeModule): ILogBuilder {
  return logCreator(module);
}

let idCounter = 0;

const loggerSessionIdNames = new Map<string, string>();

class LogEvents {
  private static subscriptions: { [id: number]: (log: ILogEntry) => any } = {};

  public static unsubscribe(subscriptionId: number): void {
    delete LogEvents.subscriptions[subscriptionId];
  }

  public static subscribe(onLogFn: (log: ILogEntry) => any): number {
    idCounter += 1;
    const id = idCounter;
    LogEvents.subscriptions[id] = onLogFn;
    return id;
  }

  public static broadcast(entry: ILogEntry): void {
    Object.values(LogEvents.subscriptions).forEach(x => x(entry));
  }
}

export { Log, LogEvents, loggerSessionIdNames, hasBeenLoggedSymbol };

export function injectLogger(builder: (module: NodeModule) => ILogBuilder): void {
  logCreator = builder;
}

export interface ILogEntry {
  id: number;
  timestamp: Date;
  action: string;
  module: string;
  sessionId?: string;
  parentId?: number;
  data?: any;
  level: LogLevel;
}

type LogLevel = keyof typeof logLevels;

interface ILogBuilder {
  log: ILog;
}

function extractPathFromModule(module: NodeModule): string {
  const fullPath = typeof module === 'string' ? module : module.filename || module.id || '';
  return fullPath
    .replace(/^(.*)[/\\]unblocked[/\\](.+)$/, '$2')
    .replace(/^(.*)[/\\]ulixee[/\\](.+)$/, '$2')
    .replace(/^(.*)[/\\]@ulixee[/\\](.+)$/, '$2')
    .replace(/^(.*)[/\\]commons[/\\](.+)$/, '$2')
    .replace(/^.*[/\\]packages[/\\](.+)$/, '$1');
}

/// LOG FILTERING //////////////////////////////////////////////////////////////////////////////////////////////////////

export function registerNamespaceMapping(
  onNamespaceFn: (namespace: string, active: RegExp[], skip: RegExp[]) => void,
): void {
  for (const ns of logFilters.namespaces.active) {
    onNamespaceFn(ns, logFilters.active, logFilters.skip);
  }
}

registerNamespaceMapping((ns, active, skip) => {
  if (ns.includes('ubk:*') || ns.includes('ubk*')) {
    active.push(/agent\/.*/);
  } else if (ns === 'ubk') {
    active.push(/agent\/.*/);
    skip.push(/DevtoolsSessionLogger/, /agent\/mitm.*/);
  } else if (ns.includes('ubk:devtools')) {
    active.push(/DevtoolsSessionLogger/);
  }
});

registerNamespaceMapping((ns, active) => {
  if (ns.includes('ulx:*') || ns.includes('ulx*')) {
    active.push(/^apps\/chromealive*/, /hero\/.*/, /net\/.*/, /databox\/.*/);
  } else if (ns.includes('hero')) {
    active.push(/^hero\/.*/, /net\/.*/);
  } else if (ns.includes('databox')) {
    active.push(/^databox\/.*/, /net\/.*/);
  }
});

function isEnabled(modulePath: string): boolean {
  if (modulePath in logFilters.enabledNamesCache) return logFilters.enabledNamesCache[modulePath];

  if (modulePath[modulePath.length - 1] === '*') {
    return true;
  }
  for (const ns of logFilters.skip) {
    if (ns.test(modulePath)) {
      logFilters.enabledNamesCache[modulePath] = false;
      return false;
    }
  }

  for (const ns of logFilters.active) {
    if (ns.test(modulePath)) {
      logFilters.enabledNamesCache[modulePath] = true;
      return true;
    }
  }

  logFilters.enabledNamesCache[modulePath] = false;
  return false;
}

function enable(namespaces: string): void {
  const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);

  for (let part of split) {
    if (!part) continue;

    part = part.replace(/\*/g, '.*?');

    if (part[0] === '-') {
      logFilters.namespaces.inactive.add(part); // .push(new RegExp('^' + part.slice(1) + '$'));
    } else {
      logFilters.namespaces.active.add(part);
      // logFilters.active.push(new RegExp('^' + part + '$'));
    }
  }
}
enable(process.env.DEBUG);
