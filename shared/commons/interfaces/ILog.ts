export default interface ILog extends IBoundLog<ILogData> {
  level: string;
  flush();
}

export interface IBoundLog<Base = any> {
  stats<T extends Base>(action: string, data?: T): number;
  info<T extends Base>(action: string, data?: T): number;
  warn<T extends Base>(action: string, data?: T): number;
  error<T extends Base>(action: string, data?: T): number;
  createChild(module, boundData?: any): IBoundLog;
}

export interface ILogData {
  sessionId: string;
  parentLogId?: number;
}
