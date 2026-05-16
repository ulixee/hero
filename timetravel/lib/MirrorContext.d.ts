import Core from '@ulixee/hero-core';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';
export default class MirrorContext {
    static createFromSessionDb(sessionId: string, core: Core, headed?: boolean): Promise<BrowserContext>;
}
