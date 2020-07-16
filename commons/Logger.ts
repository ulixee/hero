let logId = 0;
class Log implements ILog {
  public readonly level: string = process.env.DEBUG ? 'stats' : 'warn';
  private readonly module: string;
  private readonly logLevel: number;

  constructor(module: NodeModule) {
    this.logLevel = logLevels.indexOf(this.level);
    this.module = module ? extractPathFromModule(module) : '';
  }

  public stats(sessionId: string, action: string, data?: any, parentLogId?: number) {
    return this.log('stats', sessionId, action, data, parentLogId);
  }

  public info(sessionId: string, action: string, data?: any, parentLogId?: number) {
    return this.log('info', sessionId, action, data, parentLogId);
  }

  public warn(sessionId: string, action: string, data?: any, parentLogId?: number) {
    return this.log('warn', sessionId, action, data, parentLogId);
  }

  public error(sessionId: string, action: string, data?: any, parentLogId?: number) {
    return this.log('error', sessionId, action, data, parentLogId);
  }

  public flush() {
    // no-op
  }

  private log(
    level: LogLevel,
    sessionId: string,
    action: string,
    data?: any,
    parentLogId?: number,
  ) {
    const id = (logId += 1);
    const entry = {
      id,
      sessionId,
      parentId: parentLogId,
      timestamp: new Date(),
      action,
      data,
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
  stats(sessionId: string, action: string, data?: any, parentLogId?: number): number;
  info(sessionId: string, action: string, data?: any, parentLogId?: number): number;
  warn(sessionId: string, action: string, data?: any, parentLogId?: number): number;
  error(sessionId: string, action: string, data?: any, parentLogId?: number): number;
  flush();
}

function extractPathFromModule(module: NodeModule) {
  const fullPath = typeof module === 'string' ? module : module.filename || module.id || '';
  return fullPath.replace(/^(.*)\/secret-agent\/(.*)$/, '$2');
}
