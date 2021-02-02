import Log from './Logger';
import { CanceledPromiseError } from './interfaces/IPendingWaitEvent';

type ShutdownSignal = NodeJS.Signals | 'exit';

const { log } = Log(module);

export default class ShutdownHandler {
  public static exitOnSignal = true;

  private static isRegistered = false;
  private static hasRunHandlers = false;
  private static readonly onShutdownFns: {
    fn: (signal?: ShutdownSignal) => Promise<any>;
    callsite: string;
  }[] = [];

  public static register(onShutdownFn: (signal?: ShutdownSignal) => Promise<any>): void {
    this.registerSignals();
    const callsite = new Error().stack.split(/\r?\n/).slice(2, 3).shift().trim();
    this.onShutdownFns.push({ fn: onShutdownFn, callsite });
  }

  private static registerSignals(): void {
    if (!this.isRegistered) {
      this.isRegistered = true;
      process.once('exit' as any, code => ShutdownHandler.onSignal('exit', code));
      process.once('SIGTERM', ShutdownHandler.onSignal.bind(this));
      process.once('SIGINT', ShutdownHandler.onSignal.bind(this));
      process.once('SIGQUIT', ShutdownHandler.onSignal.bind(this));
    }
  }

  private static async onSignal(signal: ShutdownSignal, code?: number): Promise<void> {
    if (this.hasRunHandlers) return;
    this.hasRunHandlers = true;
    const parentLogId = log.stats('ShutdownHandler.onSignal', {
      signal,
      sessionId: null,
    });

    for (const entry of this.onShutdownFns) {
      log.stats('ShutdownHandler.execute', {
        signal,
        fn: entry.fn.toString(),
        callsite: entry.callsite,
        sessionId: null,
      });
      try {
        await entry.fn(signal);
      } catch (error) {
        if (error instanceof CanceledPromiseError) continue;
        log.warn('ShutdownHandler.errorShuttingDown', {
          error,
          sessionId: null,
        });
      }
    }

    log.stats('ShutdownHandler.shutdownComplete', {
      signal,
      exiting: this.exitOnSignal,
      sessionId: null,
      parentLogId,
    });

    if (this.exitOnSignal) {
      process.exit(code ?? 1);
    }
  }
}
