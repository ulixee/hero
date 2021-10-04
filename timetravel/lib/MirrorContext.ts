import { GlobalPool, Session } from '@ulixee/hero-core';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import CorePlugins from '@ulixee/hero-core/lib/CorePlugins';
import Log from '@ulixee/commons/lib/Logger';

const { log } = Log(module);

export default class MirrorContext {
  public static async createFromSessionDb(
    sessionId: string,
    headed = true,
  ): Promise<IPuppetContext> {
    const options = Session.restoreOptionsFromSessionRecord({}, sessionId);
    options.sessionResume = null;
    options.showBrowserInteractions = headed;
    options.showBrowser = headed;
    options.allowManualBrowserInteraction = false;

    const plugins = new CorePlugins(
      {
        humanEmulatorId: options.humanEmulatorId,
        browserEmulatorId: options.browserEmulatorId,
        userAgentSelector: options.userAgent,
        deviceProfile: options?.userProfile?.deviceProfile,
        getSessionSummary() {
          return {
            id: this.sessionId,
            options,
          };
        },
      },
      log,
    );
    plugins.browserEngine.isHeaded = options.showBrowser;
    plugins.configure(options);

    const puppet = await GlobalPool.getPuppet(plugins);
    return await puppet.newContext(plugins, log);
  }
}
