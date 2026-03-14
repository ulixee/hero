"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const NetworkManager_1 = require("./NetworkManager");
const DomStorageTracker_1 = require("./DomStorageTracker");
class FrameOutOfProcess {
    get browserContext() {
        return this.page.browserContext;
    }
    constructor(page, frame) {
        this.devtoolsSession = frame.devtoolsSession;
        this.page = page;
        this.frame = frame;
        this.networkManager = new NetworkManager_1.default(this.devtoolsSession, frame.logger, page.browserContext.proxy, page.browserContext.secretKey);
        this.domStorageTracker = new DomStorageTracker_1.default(page, page.browserContext.domStorage, this.networkManager, page.logger, page.domStorageTracker.isEnabled, this.devtoolsSession);
    }
    async initialize() {
        this.page.bindSessionEvents(this.devtoolsSession);
        const results = await Promise.all([
            this.networkManager.initializeFromParent(this.page.networkManager).catch(err => err),
            this.page.framesManager.initialize(this.devtoolsSession).catch(err => err),
            this.domStorageTracker.initialize().catch(err => err),
            this.devtoolsSession
                .send('Target.setAutoAttach', {
                autoAttach: true,
                waitForDebuggerOnStart: true,
                flatten: true,
            })
                .catch(err => err),
            this.browserContext.initializeOutOfProcessIframe(this).catch(err => err),
            this.devtoolsSession.send('Runtime.runIfWaitingForDebugger').catch(err => err),
        ]);
        for (const error of results) {
            if (error && error instanceof Error) {
                if (error instanceof IPendingWaitEvent_1.CanceledPromiseError)
                    continue;
                throw error;
            }
        }
    }
}
exports.default = FrameOutOfProcess;
//# sourceMappingURL=FrameOutOfProcess.js.map