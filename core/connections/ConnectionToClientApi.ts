import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { apiHandlers, IApis, ICoreApiRequest, ICoreApiResponse } from '../apis';

// This class emits messages vs direct responses so it can handle socket-type connections by default
export default class ConnectionToClientApi extends TypedEventEmitter<{
  message: ICoreApiResponse<any>;
}> {
  public async handleRequest<T extends keyof IApis>(apiRequest: ICoreApiRequest<T>): Promise<void> {
    const { args, api, messageId } = apiRequest;

    let result: any;
    try {
      const handler = apiHandlers[api];
      if (!handler) throw new Error(`Unknown api requested: ${api}`);
      result = await handler(args as any);
    } catch (error) {
      result = error;
    }

    const response: ICoreApiResponse<T> = {
      responseId: messageId,
      result,
    };
    this.emit('message', response);
  }
}
