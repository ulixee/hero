import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import EmittingTransportToClient from './EmittingTransportToClient';
import EmittingTransportToCore from './EmittingTransportToCore';

export default class TransportBridge {
  public transportToClient = new EmittingTransportToClient();
  public transportToCore = new EmittingTransportToCore();

  constructor(public shouldSerialize = false, private serializationMarker: string = 'DIRECT') {
    this.transportToClient.on('outbound', msg => this.sendToTransport(msg, this.transportToCore));
    this.transportToCore.on('outbound', msg => this.sendToTransport(msg, this.transportToClient));
  }

  private async sendToTransport(
    message: any,
    transport: ITypedEventEmitter<{ message: any }>,
  ): Promise<void> {
    await new Promise(process.nextTick);
    if (this.shouldSerialize) {
      message = TypeSerializer.parse(TypeSerializer.stringify(message), this.serializationMarker);
    }
    transport.emit('message', message);
  }
}
