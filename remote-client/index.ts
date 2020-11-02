import { ISecretAgent, SecretAgentClientGenerator } from '@secret-agent/client';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import CoreClient from '@secret-agent/client/lib/CoreClient';
import IRequestPayload from '@secret-agent/remote-interfaces/IRequestPayload';
import IResponsePayload from '@secret-agent/remote-interfaces/IResponsePayload';
import IEventPayload from '@secret-agent/remote-interfaces/IEventPayload';
import { createPromise } from '@secret-agent/commons/utils';
import ISecretAgentClass from "@secret-agent/client/interfaces/ISecretAgent";
import PendingMessages from './lib/PendingMessages';

// tslint:disable:variable-name

export { ISecretAgent };

process.title = 'SecretAgent-Remote';

export default class RemoteClient {
  public SecretAgent: ISecretAgentClass;
  private sendToOutgoingFn: (payload: IRequestPayload) => void;
  private readonly coreClient: CoreClient;
  private pendingMessages: PendingMessages = new PendingMessages();

  constructor() {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator({
      handleShutdownSignals: true,
      captureUncaughtClientErrors: true,
    });
    this.SecretAgent = SecretAgent;
    this.coreClient = coreClient;
    this.bindPipes();
  }

  // Attach the fn you want called every time a payload needs to be sent to core-server
  public pipeOutgoing(fn: (payload: IRequestPayload) => void) {
    this.sendToOutgoingFn = fn;
  }

  // Send any payloads that come from core-server into SA. Only Response and Event payloads
  // should be coming from the server.
  public pipeIncoming(payload: IResponsePayload | IEventPayload) {
    if ((payload as IResponsePayload).responseId) {
      this.processIncomingResponse(payload as IResponsePayload);
    } else if ((payload as IEventPayload).listenerId) {
      const { meta, listenerId, eventArgs } = payload as IEventPayload;
      this.coreClient.pipeIncomingEvent(meta, listenerId, eventArgs);
    } else {
      throw new Error(`message could not be processed: ${payload}`);
    }
  }

  // PRIVATE

  private bindPipes() {
    this.coreClient.pipeOutgoingCommand = (
      meta: ISessionMeta | null,
      command: string,
      args: any[],
    ) => {
      const { resolve, reject, promise } = createPromise<any>();
      const request = this.createRequest({ meta, command, args });
      this.sendToOutgoing(request, { resolve, reject });
      return promise;
    };
  }

  private processIncomingResponse(payload: IResponsePayload) {
    if (this.pendingMessages.has(payload.responseId)) {
      this.pendingMessages.respond(payload.responseId, payload);
    }
  }

  private sendToOutgoing(payload: IRequestPayload, resolveAndReject = null) {
    const messageId = (payload as IRequestPayload).messageId;
    if (resolveAndReject) {
      const { resolve, reject } = resolveAndReject;
      this.pendingMessages.add(messageId, resolve, reject);
    }
    this.sendToOutgoingFn(payload);
  }

  private createRequest(opts): IRequestPayload {
    return {
      messageId: this.pendingMessages.createId(),
      ...opts,
    };
  }
}
