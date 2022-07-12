import TypeSerializer from '@ulixee/commons/lib/TypeSerializer';
import ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import EmittingTransportToCore from './EmittingTransportToCore';
import EmittingTransportToClient from './EmittingTransportToClient';
import IApiHandlers from '../interfaces/IApiHandlers';

export default class TransportBridge<IClientApiSpec extends IApiHandlers, IEventSpec = any> {
  public transportToClient = new EmittingTransportToClient<IClientApiSpec, IEventSpec>();
  public transportToCore = new EmittingTransportToCore<IClientApiSpec, IEventSpec>();

  constructor(public shouldSerialize = false, private serializationMarker: string = 'DIRECT') {
    this.transportToClient.on('outbound', (msg) => this.sendToTransport(msg, this.transportToCore));
    this.transportToCore.on('outbound', (msg) => this.sendToTransport(msg, this.transportToClient));
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
