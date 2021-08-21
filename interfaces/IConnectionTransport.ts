import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';

export default interface IConnectionTransport
  extends ITypedEventEmitter<IConnectionTransportEvents> {
  send(body: string);
  close();
}

export interface IConnectionTransportEvents {
  close: void;
  message: string;
}
