import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Log from '@ulixee/commons/lib/Logger';
import IApiHandlers from '../interfaces/IApiHandlers';
import IConnectionToClient, { IConnectionToClientEvents } from '../interfaces/IConnectionToClient';
import ICoreEventPayload from '../interfaces/ICoreEventPayload';
import ICoreRequestPayload from '../interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '../interfaces/ICoreResponsePayload';
import ITransport from '../interfaces/ITransport';

const { log } = Log(module);

export default class ConnectionToClient<
    IClientApiHandlers extends IApiHandlers,
    IEventSpec,
    IHandlerMetadata = any,
  >
  extends TypedEventEmitter<IConnectionToClientEvents>
  implements IConnectionToClient<IClientApiHandlers, IEventSpec>
{
  public disconnectPromise: Promise<void>;
  public handlerMetadata?: IHandlerMetadata;

  private events = new EventSubscriber();
  constructor(readonly transport: ITransport, readonly apiHandlers: IClientApiHandlers) {
    super();

    if (transport) {
      this.events.on(transport, 'message', message => this.handleRequest(message));
      this.events.once(transport, 'disconnected', error => this.disconnect(error));
    }
  }

  public disconnect(error?: Error): Promise<void> {
    if (this.disconnectPromise) return this.disconnectPromise;

    this.disconnectPromise = new Promise<void>(async resolve => {
      try {
        this.events.close();
        await this.transport.disconnect?.();
      } finally {
        this.transport.emit('disconnected');
        this.emit('disconnected', error);
        resolve();
      }
    });
    return this.disconnectPromise;
  }

  public sendEvent<T extends keyof IEventSpec>(event: ICoreEventPayload<IEventSpec, T>): void {
    this.emit('event', { event } as any);
    this.sendMessage(event);
  }

  protected async handleRequest<T extends keyof IClientApiHandlers & string>(
    apiRequest: ICoreRequestPayload<IClientApiHandlers, T>,
  ): Promise<void> {
    if (!('messageId' in apiRequest) && !('command' in apiRequest)) return;

    const { command, messageId } = apiRequest;
    let args: any[] = apiRequest.args ?? [];
    if (!Array.isArray(args)) args = [apiRequest.args];
    if (this.handlerMetadata) args.push(this.handlerMetadata);

    const startTime = Date.now();
    let data: any;
    try {
      const handler = this.apiHandlers[command];
      if (!handler) throw new Error(`Unknown api requested: ${String(command)}`);
      this.emit('request', { request: apiRequest });
      data = await handler(...args);
    } catch (error) {
      error.stack ??= error.message;
      log.error(`Error running api`, { error, sessionId: args[0]?.heroSessionId });
      data = error;
    }

    const response: ICoreResponsePayload<IClientApiHandlers, T> = {
      responseId: messageId,
      data,
    };
    this.emit('response', {
      request: apiRequest,
      response,
      metadata: { milliseconds: Date.now() - startTime, startTime, messageId },
    });
    this.sendMessage(response);
  }

  private sendMessage(
    message: ICoreResponsePayload<IClientApiHandlers, any> | ICoreEventPayload<IEventSpec, any>,
  ): void {
    this.transport.send(message).catch(error => {
      this.emit('send-error', error);
    });
  }
}
