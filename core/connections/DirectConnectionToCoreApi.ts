import ConnectionToCoreApi from './ConnectionToCoreApi';
import ConnectionToClientApi from './ConnectionToClientApi';
import { ICoreApiRequest } from '../apis';

export default class DirectConnectionToCoreApi extends ConnectionToCoreApi {
  private connectionToClientApi = new ConnectionToClientApi();

  constructor() {
    super();
    this.connectionToClientApi.on('message', this.onMessage.bind(this));
  }

  protected internalSendRequest(message: ICoreApiRequest<any>): Promise<void> {
    return this.connectionToClientApi.handleRequest(message);
  }
}
