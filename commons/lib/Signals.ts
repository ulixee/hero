/**
 * Copied from "any-signal@4.1.1"
 *
 * This module is dual licensed under MIT and Apache-2.0.
 *
 * MIT: https://www.opensource.org/licenses/mit
 * Apache-2.0: https://www.apache.org/licenses/license-2.0
 */
export interface IClearableSignal extends AbortSignal {
  clear: () => void;
}

export default class Signals {
  /**
   * Takes an array of AbortSignals and returns a single signal.
   * If any signals are aborted, the returned signal will be aborted.
   *
   *
   */
  static any(...signals: AbortSignal[]): IClearableSignal {
    const controller = new globalThis.AbortController();

    function onAbort(): void {
      controller.abort();

      for (const signal of signals) {
        if (signal?.removeEventListener !== null) {
          signal.removeEventListener('abort', onAbort);
        }
      }
    }

    for (const signal of signals) {
      if (signal?.aborted === true) {
        onAbort();
        break;
      }

      if (signal?.addEventListener !== null) {
        signal.addEventListener('abort', onAbort);
      }
    }

    function clear(): void {
      for (const signal of signals) {
        if (signal?.removeEventListener !== null) {
          signal.removeEventListener('abort', onAbort);
        }
      }
    }

    const signal = controller.signal as IClearableSignal;
    signal.clear = clear;

    return signal;
  }

  static timeout(timeoutMillis: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMillis).unref();
    return controller.signal;
  }
}
