import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';
import ITypedEventEmitter from './ITypedEventEmitter';
import { FilterFlags, FilterOutFlags } from './AllowedNames';

export declare type DevtoolsEvents = {
  [Key in keyof ProtocolMapping.Events]: ProtocolMapping.Events[Key][0];
} & { disconnected: void };

type DevtoolsCommandParams = {
  [Key in keyof ProtocolMapping.Commands]: ProtocolMapping.Commands[Key]['paramsType'][0];
};
type OptionalParamsCommands = keyof FilterFlags<DevtoolsCommandParams, void | never>;
type RequiredParamsCommands = keyof FilterOutFlags<DevtoolsCommandParams, void | never>;

export default interface IDevtoolsSession
  extends Omit<ITypedEventEmitter<DevtoolsEvents>, 'waitOn'> {
  id: string;
  send<T extends RequiredParamsCommands>(
    method: T,
    params: DevtoolsCommandParams[T],
    sendInitiator?: object,
  ): Promise<ProtocolMapping.Commands[T]['returnType']>;
  send<T extends OptionalParamsCommands>(
    method: T,
    params?: DevtoolsCommandParams[T],
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
