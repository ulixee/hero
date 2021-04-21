import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';

export default interface IDevtoolsSession {
  id: string;
  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    params: ProtocolMapping.Commands[T]['paramsType'][0],
    sendInitiator?: object,
  ): Promise<ProtocolMapping.Commands[T]['returnType']>;

  onMessage(object: IDevtoolsResponseMessage & IDevtoolsEventMessage): void;
}

export interface IDevtoolsResponseMessage {
  sessionId: string;
  id: number;
  error?: { message: string; data: any };
  result?: any;
}

export interface IDevtoolsEventMessage {
  sessionId: string;
  method: string;
  params: object;
}
