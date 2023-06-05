import Log from '@ulixee/commons/lib/Logger';
import Core, { Session } from '@ulixee/hero-core';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import BrowserContext from '@ulixee/unblocked-agent/lib/BrowserContext';

const { log } = Log(module);

export default class MirrorContext {
  public static async createFromSessionDb(
    sessionId: string,
    core: Core,
    headed = true,
  ): Promise<BrowserContext> {
    const options = await Session.restoreOptionsFromSessionRecord({}, sessionId, core);
    delete options.resumeSessionId;
    delete options.resumeSessionStartLocation;
    options.showChromeInteractions = headed;
    options.showChrome = headed;

    const logger = log.createChild(module, { sessionId });

    const agent = core.pool.createAgent({
      options,
      logger,
      deviceProfile: options?.userProfile?.deviceProfile,
      id: sessionId,
    });

    const _ = new CorePlugins(
      agent,
      {
        getSessionSummary() {
          return {
            id: sessionId,
            options,
          };
        },
      },
      core.corePluginsById,
    );

    return await agent.open();
  }
}
