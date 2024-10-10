"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const codecPageScript_1 = require("./codecPageScript");
class BrowserCodecsPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('https', '/', this.loadScript);
        this.registerRoute('https', '/save', this.save);
        this.registerPages({ route: this.routes.https['/'], waitForReady: true });
    }
    loadScript(ctx) {
        const document = new Document_1.default(ctx);
        document.injectBodyTag((0, codecPageScript_1.default)(ctx));
        ctx.res.end(document.html);
    }
    async save(ctx) {
        const profileData = cleanProfileData(ctx.requestDetails.bodyJson);
        ctx.session.savePluginProfileData(this, profileData);
        ctx.res.end();
    }
}
exports.default = BrowserCodecsPlugin;
function cleanProfileData(profile) {
    profile.audioSupport.probablyPlays.sort();
    profile.audioSupport.maybePlays.sort();
    profile.audioSupport.recordingFormats.sort();
    profile.videoSupport.probablyPlays.sort();
    profile.videoSupport.maybePlays.sort();
    profile.videoSupport.recordingFormats.sort();
    profile.webRtcAudioCodecs.sort(webRtcSort);
    profile.webRtcVideoCodecs.sort(webRtcSort);
    return profile;
}
function webRtcSort(a, b) {
    const mimeCompare = (a.mimeType ?? '').localeCompare(b.mimeType ?? '');
    if (mimeCompare !== 0)
        return mimeCompare;
    const clockCompare = a.clockRate - b.clockRate;
    if (clockCompare !== 0)
        return clockCompare;
    return (a.sdpFmtpLine ?? '').localeCompare(b.sdpFmtpLine ?? '');
}
//# sourceMappingURL=index.js.map