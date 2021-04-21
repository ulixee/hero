import IPuppetBrowser from '@secret-agent/interfaces/IPuppetBrowser';
import ILaunchedProcess from '@secret-agent/interfaces/ILaunchedProcess';
import IPuppetLauncher from '@secret-agent/interfaces/IPuppetLauncher';
import * as os from 'os';
import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import { IPuppetLaunchError } from '@secret-agent/interfaces/IPuppetLaunchError';
import IPuppetLaunchArgs from '@secret-agent/interfaces/IPuppetLaunchArgs';
import { Browser } from './lib/Browser';
import { Connection } from './lib/Connection';

const PuppetLauncher: IPuppetLauncher = {
  getLaunchArgs(options: IPuppetLaunchArgs, engine: IBrowserEngine) {
    const chromeArguments = [];
    if (options.proxyPort !== undefined) {
      chromeArguments.push(
        // Use proxy for localhost URLs
        '--proxy-bypass-list=<-loopback>',
        `--proxy-server=localhost:${options.proxyPort}`,
      );
    }

    chromeArguments.push(
      '--remote-debugging-port=0',
      '--enable-logging',
      '--ignore-certificate-errors',
    );

    if (options.noChromeSandbox === true) {
      chromeArguments.push('--no-sandbox');
    } else if (os.platform() === 'linux') {
      const runningAsRoot = process.geteuid && process.geteuid() === 0;
      if (runningAsRoot) {
        // eslint-disable-next-line no-console
        console.warn(
          'WARNING: Secret-Agent is being run under "root" user - disabling Chrome sandbox! ' +
            'Run under regular user to get rid of this warning.',
        );
        chromeArguments.push('--no-sandbox');
      }
    }

    engine.isHeaded = options.showBrowser === true;
    if (!engine.isHeaded) {
      chromeArguments.push('--headless');
    }

    if (engine.getLaunchArguments) {
      return engine.getLaunchArguments(options, chromeArguments);
    }

    return chromeArguments;
  },
  async createPuppet(process: ILaunchedProcess, engine: IBrowserEngine): Promise<IPuppetBrowser> {
    const { transport, close } = process;
    try {
      const connection = new Connection(transport);
      return await Browser.create(connection, engine, close);
    } catch (error) {
      await close();
      throw error;
    }
  },
  translateLaunchError(rawError: Error): IPuppetLaunchError {
    // These error messages are taken from Chromium source code as of July, 2020:
    // https://github.com/chromium/chromium/blob/70565f67e79f79e17663ad1337dc6e63ee207ce9/content/browser/zygote_host/zygote_host_impl_linux.cc
    const error = {
      message: rawError.message,
      stack: rawError.stack,
      name: 'PuppetLaunchError',
      isSandboxError: false,
    };
    if (
      error.message.includes('crbug.com/357670') ||
      error.message.includes('No usable sandbox!') ||
      error.message.includes('crbug.com/638180')
    ) {
      error.stack += [
        `\nChrome sandboxing failed!`,
        `================================`,
        `To workaround sandboxing issues, do either of the following:`,
        `  - (preferred): Configure environment to support sandboxing (as here: https://github.com/ulixee/secret-agent/tree/master/tools/docker)`,
        `  - (alternative): Launch Chrome without sandbox using 'SA_NO_CHROME_SANDBOX=false' environmental variable`,
        `================================`,
        ``,
      ].join('\n');
      error.isSandboxError = true;
    }
    return error;
  },
};
export default PuppetLauncher;
