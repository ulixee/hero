"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_core_1 = require("@ulixee/hero-core");
const hero_1 = require("@ulixee/hero");
const TransportBridge_1 = require("@ulixee/net/lib/TransportBridge");
let core;
class TestHero extends hero_1.default {
    constructor(createOptions = {}) {
        createOptions.connectionToCore ??= TestHero.getDirectConnectionToCore();
        super(createOptions);
    }
    static getDirectConnectionToCore() {
        const bridge = new TransportBridge_1.default();
        core ??= new hero_core_1.default();
        core.addConnection(bridge.transportToClient);
        return new hero_1.ConnectionToHeroCore(bridge.transportToCore);
    }
}
exports.default = TestHero;
//# sourceMappingURL=TestHero.js.map