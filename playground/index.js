"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Core = void 0;
require("@ulixee/commons/lib/SourceMapSupport");
const hero_1 = require("@ulixee/hero");
const hero_core_1 = require("@ulixee/hero-core");
exports.Core = hero_core_1.default;
const TransportBridge_1 = require("@ulixee/net/lib/TransportBridge");
__exportStar(require("@ulixee/hero"), exports);
// eslint-disable-next-line @typescript-eslint/naming-convention
let _heroCore;
function initCore() {
    if (_heroCore)
        return _heroCore;
    hero_core_1.default.events.once('browser-has-no-open-windows', ({ browser }) => browser.close());
    hero_core_1.default.events.once('all-browsers-closed', () => {
        // eslint-disable-next-line no-console
        console.log('Automatically shutting down Hero Core (Browser Closed)');
        return hero_core_1.default.shutdown();
    });
    _heroCore = new hero_core_1.default();
    return _heroCore;
}
let counter = 0;
class Hero extends hero_1.default {
    constructor(createOptions = {}) {
        counter += 1;
        if (counter > 1) {
            console.warn(`You've launched multiple instances of Hero using Hero Playgrounds. @ulixee/hero-playgrounds is intended to help you get started with examples, but will try to automatically shut down after the first example is run. 
      
If you're starting to run real production scenarios, you likely want to look into converting to a Client/Core setup: 

https://ulixee.org/docs/hero/advanced-concepts/client-vs-core
`);
        }
        const transportBridge = new TransportBridge_1.default();
        createOptions.connectionToCore = new hero_1.ConnectionToHeroCore(transportBridge.transportToCore);
        initCore().addConnection(transportBridge.transportToClient);
        super(createOptions);
    }
}
exports.default = Hero;
//# sourceMappingURL=index.js.map