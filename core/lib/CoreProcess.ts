import { ChildProcess, fork } from 'child_process';
import ICoreConfigureOptions from '@secret-agent/core-interfaces/ICoreConfigureOptions';
import Dict = NodeJS.Dict;

const start = require.resolve('../start');

export default class CoreProcess {
  private static child: ChildProcess;
  private static coreHostPromise: Promise<string>;

  public static spawn(options: ICoreConfigureOptions): Promise<string> {
    const processEnv = this.getEnvironmentVariables();

    this.coreHostPromise ??= new Promise<string>((resolve, reject) => {
      this.child = fork(start, [JSON.stringify(options)], {
        detached: false,
        stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
        env: processEnv,
      });
      this.child.once('error', reject);
      this.child.once('message', message => {
        resolve(message as string);
        this.child.disconnect();
        this.child.off('error', reject);
      });
      // now that it's set, if Core shuts down, clear out the host promise
      this.child.once('exit', () => {
        this.coreHostPromise = null;
        this.child = null;
      });
    });
    return this.coreHostPromise;
  }

  public static kill(signal?: NodeJS.Signals) {
    const child = this.child;
    this.child = null;

    if (child && !child.killed) {
      const closed = new Promise<void>(resolve => child.once('exit', resolve));
      child.kill(signal);
      return closed;
    }
  }

  private static getEnvironmentVariables() {
    const processEnv: Dict<string> = {
      SA_TEMPORARY_CORE: 'true',
    };

    // whitelist env so we don't leak sensitive args out of this process.
    for (const [key, value] of Object.entries(process.env)) {
      const isWhitelisted =
        key === 'DEBUG' ||
        key === 'SHOW_BROWSER' ||
        key.startsWith('NODE_') ||
        key.startsWith('MITM_') ||
        key.startsWith('SA_') ||
        key.includes('CHROME_') ||
        key.includes('CHROMIUM_');

      if (isWhitelisted) {
        processEnv[key] = value;
      }
    }
    return processEnv;
  }
}
