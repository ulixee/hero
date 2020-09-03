import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';
import { Protocol } from 'devtools-protocol';
import { EventEmitter } from 'events';
import { assert } from '../lib/assert';
import { Connection } from './Connection';
import { IConnectionCallback } from '../interfaces/IConnectionCallback';
import { debugError } from '../lib/Utils';
import { TargetType } from '../lib/Target';

/**
 * The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.
 *
 * https://chromedevtools.github.io/devtools-protocol/
 */
export class CDPSession extends EventEmitter {
  private connection: Connection;
  private readonly sessionId: string;
  private readonly targetType: TargetType;
  private readonly pendingMessages: Map<number, IConnectionCallback> = new Map();

  constructor(connection: Connection, targetType: TargetType, sessionId: string) {
    super();
    this.connection = connection;
    this.targetType = targetType;
    this.sessionId = sessionId;
  }

  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    if (!this.isConnected()) {
      return Promise.reject(
        new Error(
          `Protocol error (${method}): Session closed. Most likely the ${this.targetType} has been closed.`,
        ),
      );
    }

    // See the comment in Connection#send explaining why we do this.
    const params = paramArgs.length ? paramArgs[0] : undefined;

    const id = this.connection.rawSend({
      sessionId: this.sessionId,
      method,
      params: params || {},
    });

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject, error: new Error(), method });
    });
  }

  onMessage(object: CDPSessionOnMessageObject): void {
    if (object.id && this.pendingMessages.has(object.id)) {
      const callback = this.pendingMessages.get(object.id);
      this.pendingMessages.delete(object.id);
      if (object.error) {
        callback.reject(createProtocolError(callback.error, callback.method, object));
      } else callback.resolve(object.result);
    } else {
      assert(!object.id);
      this.emit(object.method, object.params);
    }
  }

  /**
   * Detaches the cdpSession from the target. Once detached, the cdpSession object
   * won't emit any events and can't be used to send messages.
   */
  async detach(): Promise<void> {
    if (!this.connection) {
      throw new Error(
        `Session already detached. Most likely the ${this.targetType} has been closed.`,
      );
    }
    await this.connection.send('Target.detachFromTarget', {
      sessionId: this.sessionId,
    });
  }

  async disposeObject(remoteObject: Protocol.Runtime.RemoteObject): Promise<void> {
    if (!remoteObject.objectId) return;
    await this.send('Runtime.releaseObject', { objectId: remoteObject.objectId }).catch(error => {
      // Exceptions might happen in case of a page been navigated or closed.
      // Swallow these since they are harmless and we don't leak anything in this case.
      debugError(error);
    });
  }

  onClosed(): void {
    for (const callback of this.pendingMessages.values())
      callback.reject(
        rewriteError(callback.error, `Protocol error (${callback.method}): Target closed.`),
      );
    this.pendingMessages.clear();
    this.connection = null;
    this.emit('disconnected');
  }

  public isConnected() {
    return this.connection && !this.connection.isClosed;
  }
}

interface CDPSessionOnMessageObject {
  id?: number;
  method: string;
  params: {};
  error: { message: string; data: any };
  result?: any;
}

export function createProtocolError(
  error: Error,
  method: string,
  object: { error: { message: string; data: any } },
): Error {
  let message = `Protocol error (${method}): ${object.error.message}`;
  if ('data' in object.error) message += ` ${object.error.data}`;
  return rewriteError(error, message);
}

export function rewriteError(error: Error, message: string): Error {
  error.message = message;
  return error;
}
