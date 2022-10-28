import Core, { Session } from '@ulixee/hero-core';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import Log from '@ulixee/commons/lib/Logger';
import BrowserContext from '@unblocked-web/agent/lib/BrowserContext';

const { log } = Log(module);

export default class MirrorContext {
  public static async createFromSessionDb(
    sessionId: string,
    headed = true,
  ): Promise<BrowserContext> {
    const options = Session.restoreOptionsFromSessionRecord({}, sessionId);
    delete options.resumeSessionId;
    delete options.resumeSessionStartLocation;
    options.showChromeInteractions = headed;
    options.showChrome = headed;

    const logger = log.createChild(module, { sessionId });

    const agent = Core.pool.createAgent({
      options,
      logger,
      deviceProfile: options?.userProfile?.deviceProfile,
      id: sessionId,
    });

    // eslint-disable-next-line no-new
    new CorePlugins(agent, {
      getSessionSummary() {
        return {
          id: sessionId,
          options,
        };
      },
    });

    return await agent.open();
  }
}
