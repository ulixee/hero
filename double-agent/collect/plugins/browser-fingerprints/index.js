"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const fingerprintScript_1 = require("./fingerprintScript");
const fingerprintJs = fs.readFileSync(require.resolve('fingerprintjs2/dist/fingerprint2.min.js'));
class BrowserFingerprintPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('https', '/first', this.loadFingerprint);
        this.registerRoute('https', '/second', this.loadFingerprint);
        this.registerRoute('https', '/fingerprint.js', this.fingerprintJs);
        this.registerRoute('https', '/save', this.save);
        this.registerPages({ route: this.routes.https['/first'], waitForReady: true }, { route: this.routes.https['/second'], waitForReady: true });
        this.registerPagesOverTime({ route: this.routes.https['/first'], waitForReady: true });
    }
    loadFingerprint(ctx) {
        const document = new Document_1.default(ctx);
        document.injectBodyTag((0, fingerprintScript_1.default)(ctx));
        document.injectHeadTag(`<script src="${ctx.buildUrl('/fingerprint.js')}" type="text/javascript"></script>`);
        ctx.res.end(document.html);
    }
    async fingerprintJs(ctx) {
        ctx.res.writeHead(200, { 'Content-Type': 'text/javascript' });
        ctx.res.end(fingerprintJs);
    }
    async save(ctx) {
        const fingerprint = ctx.requestDetails.bodyJson;
        const index = extractArrayIndex(fingerprint.originatedAt);
        const profileData = ctx.session.getPluginProfileData(this, []);
        const isFirstFingerprint = index === 0;
        profileData[index] = fingerprint;
        ctx.session.savePluginProfileData(this, profileData, {
            keepInMemory: isFirstFingerprint,
        });
        ctx.res.end();
    }
}
exports.default = BrowserFingerprintPlugin;
function extractArrayIndex(originatedAt) {
    if (originatedAt.includes('/first')) {
        return 0;
    }
    if (originatedAt.includes('/second')) {
        return 1;
    }
    throw new Error(`Could not extract array index from path: ${originatedAt}`);
}
//# sourceMappingURL=index.js.map