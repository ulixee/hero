import CoreServerConnection from './lib/Connection';

interface IConfig {
  sessionsDataLocation?: string;
}

export default class CoreServer {
  public config: IConfig = {};
  private readonly connectionsByObj: Map<any, CoreServerConnection> = new Map();

  constructor(config: IConfig = {}) {
    this.config = config;
  }

  public addConnection(obj: any) {
    const connection = new CoreServerConnection(this, obj);
    this.connectionsByObj.set(obj, connection);
    return connection;
  }

  public unbindConnection(obj: any) {
    this.connectionsByObj.delete(obj);
  }
}
