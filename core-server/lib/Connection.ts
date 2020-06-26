import IRequestPayload from '@secret-agent/remote-interfaces/IRequestPayload';
import IResponsePayload from '@secret-agent/remote-interfaces/IResponsePayload';
import IEventPayload from '@secret-agent/remote-interfaces/IEventPayload';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import Core from '@secret-agent/core';
import CoreServer from '../index';
import Log from '@secret-agent/commons/Logger';

const { log } = Log(module);

export default class CoreServerConnection {
  private readonly coreServer: CoreServer;
  private readonly boundObj: any;
  private pipeOutgoingFn: (payload: IResponsePayload | IEventPayload) => void;

  constructor(coreServer: CoreServer, boundObj: any) {
    this.coreServer = coreServer;
    this.boundObj = boundObj;
    this.bindPipes();
  }

  // Attach the fn you want called every time a payload needs to be sent to core-server
  public pipeOutgoing(fn: (payload: IResponsePayload | IEventPayload) => void) {
    this.pipeOutgoingFn = fn;
  }

  // Send any payloads that come from core-client into SA. Only Request payloads
  // should be coming from the client.
  public pipeIncoming(payload: IRequestPayload) {
    const { messageId, command, meta, args } = payload;
    if (meta) {
      const core = Core.byWindowId[meta.windowId];
      this.runCommand(messageId, core, command, args).catch(error => log.error(error));
    } else {
      this.runCommand(messageId, Core, command, args).catch(error => log.error(error));
    }
  }

  public close() {
    this.coreServer.unbindConnection(this.boundObj);
  }

  private async runCommand(
    messageId: string,
    object: Core | typeof Core,
    command: string,
    args: any[],
  ) {
    const data = await object[command](...args);
    let commandId: number;
    if (object instanceof Core) {
      commandId = object.lastCommandId;
    }
    const response: IResponsePayload = {
      responseId: messageId,
      commandId,
      data,
    };
    this.pipeOutgoingFn(response);
  }

  private bindPipes() {
    Core.onEventFn = (meta: ISessionMeta, listenerId: string, eventArgs: any[]) => {
      const payload: IEventPayload = { meta, listenerId, eventArgs };
      this.pipeOutgoingFn(payload);
    };
  }
}
