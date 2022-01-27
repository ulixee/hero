import Core, { GlobalPool } from '@ulixee/hero-core';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';

let hasStarted = false;

export default function startCore(): void {
  if (hasStarted) return;
  hasStarted = true;
  ShutdownHandler.exitOnSignal = false;

  if (process.env.NODE_ENV !== 'test') {
    GlobalPool.events.on('browser-has-no-open-windows', ({ puppet }) => puppet.close());
    GlobalPool.events.on('all-browsers-closed', () => Core.shutdown());
  }
}
