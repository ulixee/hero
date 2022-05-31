import { ConnectionToClient } from '@ulixee/net';
import { heroApiHandlers, IHeroCoreApiHandlers } from '../apis';
import ITransportToClient from '@ulixee/net/interfaces/ITransportToClient';
import TransportBridge from '@ulixee/net/lib/TransportBridge';

export default class ConnectionToHeroApiClient extends ConnectionToClient<
  IHeroCoreApiHandlers,
  {}
> {
  constructor(transport: ITransportToClient<IHeroCoreApiHandlers, {}>) {
    super(transport, heroApiHandlers);
  }

  static createBridge(): TransportBridge<typeof heroApiHandlers, {}> {
    const bridge = new TransportBridge();
    new ConnectionToHeroApiClient(bridge.transportToClient);
    return bridge;
  }
}
