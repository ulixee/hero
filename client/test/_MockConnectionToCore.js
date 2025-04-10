"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EmittingTransportToCore_1 = require("@ulixee/net/lib/EmittingTransportToCore");
const ConnectionToHeroCore_1 = require("../connections/ConnectionToHeroCore");
class MockConnectionToCore extends ConnectionToHeroCore_1.default {
    constructor(mockMessageFn) {
        super(new EmittingTransportToCore_1.default());
        this.outgoingSpy = jest.fn();
        this.transport.on('outbound', async (payload) => {
            this.outgoingSpy(payload);
            const response = await mockMessageFn(payload);
            this.transport.emit('message', response);
        });
    }
    fakeEvent(event) {
        this.onEvent(event);
    }
}
exports.default = MockConnectionToCore;
//# sourceMappingURL=_MockConnectionToCore.js.map