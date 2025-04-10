"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = configureHttp2Session;
function configureHttp2Session(emulationProfile, data, resource, settings) {
    settings.localWindowSize = data.http2Settings.firstFrameWindowSize;
    settings.settings = data.http2Settings.settings;
}
//# sourceMappingURL=configureHttp2Session.js.map