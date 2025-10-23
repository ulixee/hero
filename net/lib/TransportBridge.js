"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const EmittingTransportToClient_1 = require("./EmittingTransportToClient");
const EmittingTransportToCore_1 = require("./EmittingTransportToCore");
class TransportBridge {
    constructor(shouldSerialize = false, serializationMarker = 'DIRECT') {
        this.shouldSerialize = shouldSerialize;
        this.serializationMarker = serializationMarker;
        this.transportToClient = new EmittingTransportToClient_1.default();
        this.transportToCore = new EmittingTransportToCore_1.default();
        this.transportToClient.on('outbound', msg => this.sendToTransport(msg, this.transportToCore));
        this.transportToCore.on('outbound', msg => this.sendToTransport(msg, this.transportToClient));
    }
    async sendToTransport(message, transport) {
        await new Promise(process.nextTick);
        if (this.shouldSerialize) {
            message = TypeSerializer_1.default.parse(TypeSerializer_1.default.stringify(message), this.serializationMarker);
        }
        transport.emit('message', message);
    }
}
exports.default = TransportBridge;
//# sourceMappingURL=TransportBridge.js.map