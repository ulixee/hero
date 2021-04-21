import ITypedEventEmitter from './ITypedEventEmitter';

export default interface IConnectionTransport
  extends ITypedEventEmitter<IConnectionTransportEvents> {
  url?: string;
  send(body: string);
  close();
  clone(): IConnectionTransport;
  waitForOpen: Promise<void>;
}

export interface IConnectionTransportEvents {
  close: void;
  message: string;
}
