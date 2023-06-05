import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import * as readline from 'readline';
import { ReadLine } from 'readline';

export default class CoreKeepAlivePrompt {
  public readonly message: string;
  private cliPrompt: ReadLine;

  constructor(message: string, private onQuit: () => Promise<any>) {
    this.close = this.close.bind(this);
    if (/yes|1|true/i.test(process.env.ULX_CLI_NOPROMPT)) return;

    this.message = `\n\n${message}\n\nPress Q or kill the CLI to exit and close Chrome:\n\n`;

    this.cliPrompt = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setEncoding('utf8');
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    this.cliPrompt.setPrompt(this.message);

    process.stdin.on('keypress', async (chunk, key) => {
      if (
        key.name?.toLowerCase() === 'q' ||
        (key.name?.toLowerCase() === 'c' && key.ctrl === true)
      ) {
        try {
          await this.onQuit();
        } catch (error) {
          if (error instanceof CanceledPromiseError) return;
          throw error;
        }
      }
    });
    ShutdownHandler.register(this.close);
    this.cliPrompt.prompt(true);
  }

  public close(): void {
    ShutdownHandler.unregister(this.close);
    if (this.cliPrompt) {
      this.cliPrompt.close();
      this.cliPrompt = null;
    }
  }
}
