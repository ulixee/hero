import { ChildProcess, fork } from 'child_process';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';

const start = require.resolve('../start');

export default class CoreProcess {
  private static child: ChildProcess;
  private static coreHostPromise: Promise<string>;

  public static spawn(options: ICoreConfigureOptions): Promise<string> {
    this.coreHostPromise ??= new Promise<string>((resolve, reject) => {
      this.child = fork(start, [JSON.stringify(options)], {
        detached: false,
        stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
        env: {
          HERO_TEMPORARY_CORE: 'true',
          ...process.env,
        },
      });
      this.child.once('error', reject);
      this.child.once('message', message => {
        resolve(message as string);
        this.child.disconnect();
        this.child.off('error', reject);
      });
      // now that it's set, if Core shuts down, clear out the host promise
      this.child.once('exit', () => {
        this.child.removeAllListeners('message');
        this.child.removeAllListeners('error');
        this.coreHostPromise = null;
        this.child = null;
      });
    });
    return this.coreHostPromise;
  }

  public static kill(signal?: NodeJS.Signals) {
    const child = this.child;
    if (child) {
      const closed = new Promise<void>(resolve => child.once('exit', () => setImmediate(resolve)));
      if (!child.killed) child.kill(signal);
      return closed;
    }
  }
}
