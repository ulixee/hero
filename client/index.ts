import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import SetupAwaitedHandler from './lib/SetupAwaitedHandler';
// run before any other imports
SetupAwaitedHandler();

import Browser, { createBrowser } from './lib/Browser';
import IConfigureOptions from '@secret-agent/core-interfaces/IConfigureOptions';
import ICreateBrowserOptions from './interfaces/ICreateBrowserOptions';
import { RenderingOption } from '@secret-agent/core-interfaces/IWindowOptions';
import CoreClient from './lib/CoreClient';
import ISecretAgent, {
  ISecretAgentConfigureOptions,
  SecretAgentStatics,
} from './interfaces/ISecretAgent';

// tslint:disable:variable-name
const DefaultOptions = {
  maxActiveSessionCount: 10,
  localProxyPortStart: 10e3,
  sessionsDir: '/tmp',
  defaultRenderingOptions: [RenderingOption.All],
  defaultUserProfile: {},
};

export function SecretAgentClientGenerator() {
  const coreClient = new CoreClient();

  @SecretAgentStatics
  class SecretAgent {
    private static options: ISecretAgentConfigureOptions = { ...DefaultOptions };

    public static async configure(options: Partial<ISecretAgentConfigureOptions>): Promise<void> {
      this.options = Object.assign({}, DefaultOptions, this.options, options);
      await coreClient.configure(options as IConfigureOptions);
    }

    public static async createBrowser(options: ICreateBrowserOptions = {}): Promise<Browser> {
      options.renderingOptions = options.renderingOptions || this.options.defaultRenderingOptions;
      options.userProfile = options.userProfile || this.options.defaultUserProfile;
      return createBrowser(options as ICreateBrowserOptions, coreClient);
    }

    public static async start(options: Partial<ISecretAgentConfigureOptions> = {}) {
      this.options = Object.assign({}, DefaultOptions, this.options, options);
      await coreClient.start(options as IConfigureOptions);
    }

    public static async shutdown() {
      await coreClient.shutdown();
    }
  }

  ['beforeExit', 'exit', 'SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(name => {
    // @ts-ignore
    process.once(name, async () => await SecretAgent.shutdown());
  });

  return { SecretAgent, coreClient };
}

export { LocationStatus, ISecretAgent };
