import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';

export interface IWebsocketMessage {
  resourceId: number;
  messageId: number;
  timestamp: number;
  message: string | Buffer;
  source: 'server' | 'client';
}

export default class WebsocketMessages extends TypedEventEmitter<{
  new: { lastCommandId: number; message: IWebsocketMessage };
}> {
  private readonly websocketMessages: IWebsocketMessage[] = [];
  private websocketListeners: {
    [resourceId: string]: ((msg: IWebsocketMessage) => any)[];
  } = {};

  private messageIdCounter = 0;
  private logger: IBoundLog;

  constructor(logger: IBoundLog) {
    super();
    this.logger = logger.createChild(module);
  }

  public cleanup(): void {
    this.websocketListeners = {};
    this.websocketMessages.length = 0;
  }

  public getMessages(resourceId: number): IWebsocketMessage[] {
    const messages: IWebsocketMessage[] = [];
    for (const message of this.websocketMessages) {
      if (message.resourceId === resourceId) {
        messages.push(message);
      }
    }
    return messages;
  }

  public listen(resourceId: number, listenerFn: (message: IWebsocketMessage) => any): void {
    if (!this.websocketListeners[resourceId]) {
      this.websocketListeners[resourceId] = [];
    }
    this.websocketListeners[resourceId].push(listenerFn);
    // push all existing
    for (const message of this.websocketMessages) {
      if (message.resourceId === resourceId) {
        listenerFn(message);
      }
    }
  }

  public unlisten(resourceId: number, listenerFn: (message: IWebsocketMessage) => any): void {
    const listeners = this.websocketListeners[resourceId];
    if (!listeners) return;
    const idx = listeners.indexOf(listenerFn);
    if (idx >= 0) listeners.splice(idx, 1);
  }

  public record(
    event: {
      resourceId: number;
      isFromServer: boolean;
      message: string | Buffer;
      lastCommandId: number;
      timestamp: number;
    },
    isMitmEnabled: boolean,
  ): IWebsocketMessage | undefined {
    if (!event.resourceId && isMitmEnabled) {
      this.logger.error(`CaptureWebsocketMessageError.UnregisteredResource`, {
        event,
      });
      return;
    }

    const { resourceId, isFromServer, message, timestamp } = event;

    const resourceMessage = {
      resourceId,
      message,
      messageId: (this.messageIdCounter += 1),
      source: isFromServer ? 'server' : 'client',
      timestamp,
    } as IWebsocketMessage;

    this.websocketMessages.push(resourceMessage);
    this.emit('new', { lastCommandId: event.lastCommandId, message: resourceMessage });

    const listeners = this.websocketListeners[resourceMessage.resourceId];
    if (listeners) {
      for (const listener of listeners) {
        listener(resourceMessage);
      }
    }
    return resourceMessage;
  }
}
