import ITypedEventEmitter from '@secret-agent/commons/interfaces/ITypedEventEmitter';

export default interface IPuppetConnection extends ITypedEventEmitter<IPuppetConnectionEvents> {}

export interface IPuppetConnectionEvents {
  disconnected: void;
}
