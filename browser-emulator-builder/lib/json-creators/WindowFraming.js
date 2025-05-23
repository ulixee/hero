"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const EmulatorData_1 = require("../EmulatorData");
class WindowFraming {
    constructor(config, userAgentIds) {
        this.dataByOsId = {};
        this.browserId = config.browserId;
        for (const userAgentId of userAgentIds) {
            const profile = unblocked_browser_profiler_1.default.getProfile('browser-dom-environment', userAgentId);
            const { operatingSystemId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
            const window = profile.data.https.window;
            const screenGapTop = Number(window.screen.availTop._$value);
            const screenGapLeft = Number(window.screen.availLeft._$value);
            const screenGapBottom = window.screen.height._$value - window.screen.availHeight._$value - screenGapTop;
            const screenGapRight = window.screen.width._$value - window.screen.availWidth._$value - screenGapLeft;
            const frameBorderWidth = window.outerWidth._$value - window.innerWidth._$value;
            const frameBorderHeight = window.outerHeight._$value - window.innerHeight._$value;
            const framing = {
                screenGapLeft,
                screenGapTop,
                screenGapRight,
                screenGapBottom,
                frameBorderWidth,
                frameBorderHeight,
                devicePixelRatio: window.devicePixelRatio._$value,
                colorDepth: window.screen.colorDepth._$value,
            };
            const minimumFraming = this.data || { ...framing };
            if (framing.screenGapLeft > minimumFraming.screenGapLeft) {
                minimumFraming.screenGapLeft = framing.screenGapLeft;
            }
            if (framing.screenGapTop > minimumFraming.screenGapTop) {
                minimumFraming.screenGapTop = framing.screenGapTop;
            }
            if (framing.screenGapRight > minimumFraming.screenGapRight) {
                minimumFraming.screenGapRight = framing.screenGapRight;
            }
            if (framing.screenGapBottom > minimumFraming.screenGapBottom) {
                minimumFraming.screenGapBottom = framing.screenGapBottom;
            }
            if (framing.frameBorderWidth > minimumFraming.frameBorderWidth) {
                minimumFraming.frameBorderWidth = framing.frameBorderWidth;
            }
            if (framing.frameBorderHeight > minimumFraming.frameBorderHeight) {
                minimumFraming.frameBorderHeight = framing.frameBorderHeight;
            }
            this.data = minimumFraming;
            this.dataByOsId[operatingSystemId] = framing;
        }
    }
    save(dataDir) {
        for (const [osId, data] of Object.entries(this.dataByOsId)) {
            const dataOsDir = EmulatorData_1.default.getEmulatorDataOsDir(dataDir, osId);
            if (!Fs.existsSync(dataOsDir))
                Fs.mkdirSync(dataOsDir, { recursive: true });
            Fs.writeFileSync(`${dataOsDir}/window-framing.json`, JSON.stringify(data, null, 2));
        }
        {
            if (!Fs.existsSync(dataDir))
                Fs.mkdirSync(dataDir, { recursive: true });
            const dataString = JSON.stringify(this.data, null, 2);
            Fs.writeFileSync(`${dataDir}/window-base-framing.json`, `${dataString}\n`);
        }
    }
}
exports.default = WindowFraming;
//# sourceMappingURL=WindowFraming.js.map