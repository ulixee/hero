import logger from './Logger';
import { CanceledPromiseError } from '../interfaces/IPendingWaitEvent';

type ShutdownSignal = NodeJS.Signals | 'exit';

const { log } = logger(module);

export default class ShutdownHandler {
  public static exitOnSignal = false;
  public static disableSignals = false;

  private static isRegistered = false;
  private static hasRunHandlers = false;
  private static readonly onShutdownFns: {
    fn: (signal?: ShutdownSignal) => Promise<any> | any;
    callsite: string;
    runWithDisabledSignals?: boolean;
  }[] = [];

  public static register(
    onShutdownFn: (signal?: ShutdownSignal) => Promise<any> | any,
    runWithDisabledSignals?: boolean,
  ): void {
    this.registerSignals();
    const callsite = new Error().stack.split(/\r?\n/).slice(2, 3).shift().trim();
    this.onShutdownFns.push({ fn: onShutdownFn, callsite, runWithDisabledSignals });
  }

  public static unregister(onShutdownFn: (signal?: ShutdownSignal) => Promise<any> | any): void {
    const match = this.onShutdownFns.findIndex(x => x.fn === onShutdownFn);
    if (match >= 0) this.onShutdownFns.splice(match, 1);
  }

  public static run(): Promise<void> {
    return this.onSignal('exit', null, true);
  }

  public static registerSignals(): void {
    if (!this.isRegistered) {
      this.isRegistered = true;
      process.once('beforeExit', code => ShutdownHandler.onSignal('beforeExit' as any, code));
      process.once('exit' as any, code => ShutdownHandler.onSignal('exit', code));
      process.once('SIGTERM', ShutdownHandler.onSignal.bind(this));
      process.once('SIGINT', ShutdownHandler.onSignal.bind(this));
      process.once('SIGQUIT', ShutdownHandler.onSignal.bind(this));
    }
  }

  private static async onSignal(
    signal: ShutdownSignal,
    code?: number,
    isManual = false,
  ): Promise<void> {
    if (this.hasRunHandlers) return;
    this.hasRunHandlers = true;

    const parentLogId = log.stats('ShutdownHandler.onSignal', {
      signal,
      sessionId: null,
    });

    const keepList = [];
    while (this.onShutdownFns.length) {
      const entry = this.onShutdownFns.shift();
      if (this.disableSignals && !isManual && !entry.runWithDisabledSignals) {
        keepList.push(entry);
        continue;
      }

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
    this.onShutdownFns.push(...keepList);

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
