import Resolvable from '@ulixee/commons/lib/Resolvable';
import { IApis, ICoreApiRequest, ICoreApiResponse } from '../apis';

export default abstract class ConnectionToCoreApi {
  private messageIdCounter = 0;
  private pendingMessagesById = new Map<string, Resolvable<ICoreApiResponse<any>['result']>>();
  private connectPromise: Promise<Error | void>;

  protected abstract internalSendRequest<T extends keyof IApis>(
    message: ICoreApiRequest<T>,
  ): Promise<void>;

  public async run<T extends keyof IApis>(
    apiRequest: Omit<ICoreApiRequest<T>, 'messageId'>,
  ): Promise<ICoreApiResponse<T>['result']> {
    const connectOrError = await this.connect();
    if (connectOrError) throw connectOrError;

    // save pending message
    const messageId = String((this.messageIdCounter += 1));
    const resolvable = new Resolvable<ICoreApiResponse<T>['result']>();
    this.pendingMessagesById.set(messageId, resolvable);

    await this.internalSendRequest({ ...apiRequest, messageId });

    return await resolvable.promise;
  }

  public onMessage(event: ICoreApiResponse<any>) {
    const resolvable = this.pendingMessagesById.get(event.responseId);
    this.pendingMessagesById.delete(event.responseId);

    if (event.result instanceof Error) resolvable.reject(event.result);
    else resolvable.resolve(event.result);
  }

  public connect(): Promise<Error | void> {
    this.connectPromise ??= this.createConnection();
    return this.connectPromise;
  }

  public async disconnect(): Promise<void> {
    if (this.connectPromise) {
      await this.destroyConnection();
    }
  }

  protected createConnection?(): Promise<Error | void> {
    return Promise.resolve();
  }

  protected destroyConnection?(): Promise<any> {
    return Promise.resolve();
  }
}
