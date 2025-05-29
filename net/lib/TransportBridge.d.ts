import EmittingTransportToClient from './EmittingTransportToClient';
import EmittingTransportToCore from './EmittingTransportToCore';
export default class TransportBridge {
    shouldSerialize: boolean;
    private serializationMarker;
    transportToClient: EmittingTransportToClient;
    transportToCore: EmittingTransportToCore;
    constructor(shouldSerialize?: boolean, serializationMarker?: string);
    private sendToTransport;
}
