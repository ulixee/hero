import IWebsocketResourceMessage from '@ulixee/hero-interfaces/IWebsocketResourceMessage';
import IWebsocketMessage from '@ulixee/hero-interfaces/IWebsocketMessage';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import SessionDb from '../dbs/SessionDb';

const { log } = Log(module);

export default class WebsocketMessages {
  private readonly websocketMessages: IWebsocketResourceMessage[] = [];
  private websocketListeners: {
    [resourceId: string]: ((msg: IWebsocketResourceMessage) => any)[];
  } = {};

  private websocketMessageIdCounter = 0;
  private logger: IBoundLog;

  constructor(readonly db: SessionDb) {
    this.logger = log.createChild(module, {
      sessionId: db.sessionId,
    });
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

  public record(event: {
    resourceId: number;
    isFromServer: boolean;
    message: string | Buffer;
    lastCommandId: number;
    timestamp: number;
  }): IWebsocketResourceMessage | undefined {
    if (!event.resourceId) {
      this.logger.error(`CaptureWebsocketMessageError.UnregisteredResource`, {
        event,
      });
      return;
    }

    const { resourceId, isFromServer, message, timestamp } = event;

    const resourceMessage = {
      resourceId,
      message,
      messageId: (this.websocketMessageIdCounter += 1),
      source: isFromServer ? 'server' : 'client',
      timestamp,
    } as IWebsocketResourceMessage;

    this.websocketMessages.push(resourceMessage);
    this.db.websocketMessages.insert(event.lastCommandId, resourceMessage);

    const listeners = this.websocketListeners[resourceMessage.resourceId];
    if (listeners) {
      for (const listener of listeners) {
        listener(resourceMessage);
      }
    }
    return resourceMessage;
  }
}
