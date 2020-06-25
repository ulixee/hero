let logId = 0;
class Log implements ILog {
  public level: string = process.env.DEBUG ? 'stats' : 'warn';
  private readonly module: string;
  constructor(module: NodeModule) {
    this.module = module ? extractPathFromModule(module) : '';
  }

  public stats(action: string, data?: any, parentMessageId?: number) {
    if (this.level === 'stats') {
      console.log(
        `${new Date().toISOString()} STATS ${action}`,
        ...[parentMessageId, data].filter(x => x !== undefined && x !== null),
      );
      return (logId += 1);
    }
  }

  public info(action: string, data?: any, parentMessageId?: number) {
    if (this.level === 'stats' || this.level === 'info') {
      console.log(
        `${new Date().toISOString()} INFO ${action}`,
        ...[parentMessageId, data].filter(x => x !== undefined && x !== null),
      );
      return (logId += 1);
    }
  }

  public warn(action: string, data?: any, parentMessageId?: number) {
    if (this.level === 'warn' || this.level === 'stats' || this.level === 'info') {
      console.log(
        `${new Date().toISOString()} WARN ${action}`,
        ...[parentMessageId, data].filter(x => x !== undefined && x !== null),
      );
      return (logId += 1);
    }
  }

  public error(action: string, data?: any, parentMessageId?: number) {
    console.log(
      `${new Date().toISOString()} ERROR ${action}`,
      ...[parentMessageId, data].filter(x => x !== undefined && x !== null),
    );
    return (logId += 1);
  }

  public flush() {
    // no-op
  }
}

let logCreator = (module: NodeModule) => {
  const log: ILog = new Log(module);

  return {
    log,
  };
};

export default function logger(module: NodeModule): ILogBuilder {
  return logCreator(module);
}

export function injectLogger(builder: (module: NodeModule) => ILogBuilder) {
  logCreator = builder;
}

interface ILogBuilder {
  log: ILog;
}

export interface ILog {
  level: string;
  stats(action: string, data?: any, parentMessageId?: number): number;
  info(action: string, data?: any, parentMessageId?: number): number;
  warn(action: string, data?: any, parentMessageId?: number): number;
  error(action: string, data?: any, parentMessageId?: number): number;
  flush();
}

function extractPathFromModule(module: NodeModule) {
  const fullPath = typeof module === 'string' ? module : module.filename || module.id || '';
  return fullPath.replace(/^(.*)\/secret-agent\/(.*)$/, '$2');
}
