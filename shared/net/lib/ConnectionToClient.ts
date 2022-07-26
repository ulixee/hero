import Log from '@ulixee/commons/lib/Logger';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import ICoreEventPayload from '../interfaces/ICoreEventPayload';
import ICoreResponsePayload from '../interfaces/ICoreResponsePayload';
import IApiHandlers from '../interfaces/IApiHandlers';
import ICoreRequestPayload from '../interfaces/ICoreRequestPayload';
import ITransportToClient from '../interfaces/ITransportToClient';
import IConnectionToClient, { IConnectionToClientEvents } from '../interfaces/IConnectionToClient';

const { log } = Log(module);

export default class ConnectionToClient<IClientApiHandlers extends IApiHandlers, IEventSpec>
  extends TypedEventEmitter<IConnectionToClientEvents>
  implements IConnectionToClient<IClientApiHandlers, IEventSpec>
{
  public disconnectPromise: Promise<void>;
  public handlerMetadata?: any;

  private events = new EventSubscriber();
  constructor(
    readonly transport: ITransportToClient<IClientApiHandlers, IEventSpec>,
    readonly apiHandlers: IClientApiHandlers,
  ) {
    super();

    this.events.on(transport, 'message', message => this.handleRequest(message));
    this.events.once(transport, 'disconnected', error => this.disconnect(error));
  }

  public disconnect(error?: Error): Promise<void> {
    if (this.disconnectPromise) return this.disconnectPromise;

    this.disconnectPromise = new Promise<void>(async resolve => {
      await this.transport.disconnect?.();
      this.events.close();
      this.transport.emit('disconnected');
      this.emit('disconnected', error);
      resolve();
    });
    return this.disconnectPromise;
  }

  public sendEvent<T extends keyof IEventSpec>(event: ICoreEventPayload<IEventSpec, T>): void {
    this.sendMessage(event);
  }

  protected async handleRequest<T extends keyof IClientApiHandlers>(
    apiRequest: ICoreRequestPayload<IClientApiHandlers, T>,
  ): Promise<void> {
    const { command, messageId } = apiRequest;
    let args: any[] = apiRequest.args ?? [];
    if (!Array.isArray(args)) args = [apiRequest.args];
    if (this.handlerMetadata) args.push(this.handlerMetadata);

    let data: any;
    try {
      const handler = this.apiHandlers[command];
      if (!handler) throw new Error(`Unknown api requested: ${String(command)}`);
      data = await handler(...args);
    } catch (error) {
      log.error('Error running api', { error, sessionId: args[0]?.heroSessionId });
      data = error;
    }

    const response: ICoreResponsePayload<IClientApiHandlers, T> = {
      responseId: messageId,
      data,
    };
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
