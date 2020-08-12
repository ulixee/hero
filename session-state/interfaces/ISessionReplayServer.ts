import { AddressInfo } from 'net';

export default interface ISessionReplayServer {
  listen: (listenPort?: number) => Promise<AddressInfo>;
  url: () => string;
  hasClients: () => boolean;
  close: (waitForOpenConnections: boolean) => Promise<void>;
}
