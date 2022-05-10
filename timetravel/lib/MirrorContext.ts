import Core, { Session } from '@ulixee/hero-core';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import Log from '@ulixee/commons/lib/Logger';
import BrowserContext from '@unblocked-web/secret-agent/lib/BrowserContext';

const { log } = Log(module);

export default class MirrorContext {
  public static async createFromSessionDb(
    sessionId: string,
    headed = true,
  ): Promise<BrowserContext> {
    const options = Session.restoreOptionsFromSessionRecord({}, sessionId);
    options.sessionResume = null;
    options.showChromeInteractions = headed;
    options.showChrome = headed;

    const logger = log.createChild(module, { sessionId });
    const plugins = new CorePlugins(
      {
        humanEmulatorId: options.humanEmulatorId,
        browserEmulatorId: options.browserEmulatorId,
        userAgentSelector: options.userAgent,
        deviceProfile: options?.userProfile?.deviceProfile,
        getSessionSummary() {
          return {
            id: sessionId,
            options,
          };
        },
      },
      logger,
    );
    plugins.browserEngine.isHeaded = options.showChrome;
    plugins.configure(options);

    const browser = await Core.pool.getBrowser(plugins.browserEngine, plugins);

    return await browser.newContext({ logger });
  }
}
