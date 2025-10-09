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
    static any(...signals: AbortSignal[]): IClearableSignal;
    static timeout(timeoutMillis: number): AbortSignal;
}
