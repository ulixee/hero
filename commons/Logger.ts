let logId = 0;
class Log implements ILog {
  public readonly level: string = process.env.DEBUG ? 'stats' : 'warn';
  private readonly module: string;
  private readonly logLevel: number;

  constructor(module: NodeModule) {
    this.logLevel = logLevels.indexOf(this.level);
    this.module = module ? extractPathFromModule(module) : '';
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

  public flush() {
    // no-op
  }

  private log(level: LogLevel, action: string, data?: ILogData) {
    let logData: object;
    let sessionId: string = null;
    let parentId: number;
    if (data) {
      for (const [key, val] of Object.entries(data)) {
        if (key === 'parentLogId') parentId = val;
        else if (key === 'sessionId') sessionId = val;
        else {
          if (!logData) logData = {};
          logData[key] = val;
        }
      }
    }

    const id = (logId += 1);
    const entry = {
      id,
      sessionId,
      parentId,
      timestamp: new Date(),
      action,
      data: logData,
      level,
    };
    const printToConsole = logLevels.indexOf(level) >= this.logLevel;
    if (printToConsole) {
      console.log(
        `${entry.timestamp.toISOString()} ${entry.level.toUpperCase()} ${entry.action}`,
        ...[entry.data].filter(x => x !== undefined && x !== null),
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
    const id = (idCounter += 1);
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
  sessionId?: string;
  parentId?: number;
  data?: any;
  level: LogLevel;
}

type LogLevel = 'stats' | 'info' | 'warn' | 'error';

interface ILogBuilder {
  log: ILog;
}

export interface ILog {
  level: string;
  stats<T extends ILogData>(action: string, data?: T): number;
  info<T extends ILogData>(action: string, data?: T): number;
  warn<T extends ILogData>(action: string, data?: T): number;
  error<T extends ILogData>(action: string, data?: T): number;
  flush();
}

interface ILogData {
  sessionId: string;
  parentLogId?: number;
}

function extractPathFromModule(module: NodeModule) {
  const fullPath = typeof module === 'string' ? module : module.filename || module.id || '';
  return fullPath.replace(/^(.*)\/secret-agent\/(.*)$/, '$2');
}
