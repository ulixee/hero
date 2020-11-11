// eslint-disable-next-line max-classes-per-file
import ILog, { ILogData } from "@secret-agent/core-interfaces/ILog";

let logId = 0;
class Log implements ILog {
  public readonly level: string = process.env.DEBUG ? 'stats' : 'warn';
  private readonly module: string;
  private readonly logLevel: number;
  private readonly boundContext: any = {};

  constructor(module: NodeModule, boundContext?: any) {
    this.logLevel = logLevels.indexOf(this.level);
    this.module = module ? extractPathFromModule(module) : '';
    if (boundContext) this.boundContext = boundContext;
  }

  public stats(action: string, data?: ILogData) {
    return this.log('stats', action, data);
  }

  public info(action: string, data?: ILogData) {
    return this.log('info', action, data);
  }

  public warn(action: string, data?: ILogData) {
    return this.log('warn', action, data);
  }

  public error(action: string, data?: ILogData) {
    return this.log('error', action, data);
  }

  public createChild(module, boundContext?: any): ILog {
    return new Log(module, {
      ...this.boundContext,
      ...boundContext,
    });
  }

  public flush() {
    // no-op
  }

  private log(level: LogLevel, action: string, data?: ILogData) {
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
    const printToConsole = logLevels.indexOf(level) >= this.logLevel;
    if (printToConsole) {
      const printablePath = entry.module
        .replace('.js', '')
        .replace('.ts', '')
        .replace('build/', '');
      const printData = {};
      for (const [key, value] of Object.entries(entry.data)) {
        if (value === undefined || value === null) continue;
        if (value instanceof Error) {
          printData[key] = value.toString();
        } else {
          printData[key] = value;
        }
      }
      const params = Object.keys(printData).length ? [printData] : [];
      // eslint-disable-next-line no-console
      console.log(
        `${entry.timestamp.toISOString()} ${entry.level.toUpperCase()} [${printablePath}] ${
          entry.action
        }`,
        ...params,
      );
    }
    LogEvents.broadcast(entry);
    return id;
  }
}

const logLevels = ['stats', 'info', 'warn', 'error'];

let logCreator = (module: NodeModule) => {
  const log: ILog = new Log(module);

  return {
    log,
  };
};

export default function logger(module: NodeModule): ILogBuilder {
  return logCreator(module);
}

let idCounter = 0;

class LogEvents {
  private static subscriptions: { [id: number]: (log: ILogEntry) => any } = {};

  public static unsubscribe(subscriptionId: number) {
    delete LogEvents.subscriptions[subscriptionId];
  }

  public static subscribe(onLogFn: (log: ILogEntry) => any) {
    idCounter += 1;
    const id = idCounter;
    LogEvents.subscriptions[id] = onLogFn;
    return id;
  }

  public static broadcast(entry: ILogEntry) {
    Object.values(LogEvents.subscriptions).forEach(x => x(entry));
  }
}

export { LogEvents };

export function injectLogger(builder: (module: NodeModule) => ILogBuilder) {
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

type LogLevel = 'stats' | 'info' | 'warn' | 'error';

interface ILogBuilder {
  log: ILog;
}

function extractPathFromModule(module: NodeModule) {
  const fullPath = typeof module === 'string' ? module : module.filename || module.id || '';
  return fullPath.replace(/^(.*)\/secret-agent\/(.*)$/, '$2');
}
