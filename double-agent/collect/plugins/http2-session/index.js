"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Plugin_1 = require("@double-agent/collect/lib/Plugin");
const Document_1 = require("@double-agent/collect/lib/Document");
const index_1 = require("@double-agent/config/index");
const { MainDomain } = index_1.default.collect.domains;
class Http2SessionPlugin extends Plugin_1.default {
    initialize() {
        this.registerRoute('http2', '/', this.load);
        this.registerRoute('http2', '/wait', this.wait);
        this.registerRoute('http2', '/wait2', this.wait);
        this.registerPages({
            route: this.routes.http2['/wait'],
            domain: MainDomain,
            waitForReady: true,
        }, {
            route: this.routes.http2['/wait2'],
            domain: MainDomain,
            waitForReady: true,
        }, {
            route: this.routes.http2['/'],
            domain: MainDomain,
            waitForReady: true,
        });
    }
    async load(ctx) {
        this.saveSessions(ctx);
        const document = new Document_1.default(ctx);
        document.addNextPageClick();
        ctx.res.end(document.html);
    }
    async wait(ctx) {
        this.saveSessions(ctx);
        const document = new Document_1.default(ctx);
        document.addNextPageClick();
        // https://github.com/chromium/chromium/blob/99314be8152e688bafbbf9a615536bdbb289ea87/net/spdy/spdy_session.cc#L92
        document.injectBodyTag(`<script type="text/javascript">
         // give 10 seconds for ping to run
         const wait = new Promise(resolve => {
          setTimeout(() => resolve(), 10000);
        });
        window.pageQueue.push(wait);
    </script>`);
        ctx.res.end(document.html);
    }
    saveSessions(ctx) {
        const server = ctx.server;
        const id = ctx.session.id;
        const sessionParam = `sessionId=${id}`;
        const profileData = {
            sessions: [],
        };
        for (const session of server.sessions) {
            const isMatch = session.activity.some((x) => x.data?.path?.includes(sessionParam));
            if (isMatch) {
                profileData.sessions.push({
                    activity: session.activity,
                    id: session.id,
                    origins: session.session.originSet,
                });
            }
        }
        ctx.session.savePluginProfileData(this, profileData);
    }
}
exports.default = Http2SessionPlugin;
//# sourceMappingURL=index.js.map