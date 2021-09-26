// This import statement is important for all this to work, otherwise we don't extend but replace the ulixee module definition.
// https://github.com/microsoft/TypeScript/issues/10859
import type {} from '@ulixee/hero/lib/extendables';
import ClientPlugin from './lib/ClientPlugin';
import CorePlugin from './lib/CorePlugin';

interface IExecuteJsPlugin {
  executeJs<T extends any[]>(fn: string | ((...args: T) => any), ...args: T);
}

declare module '@ulixee/hero/lib/extendables' {
  interface Hero extends IExecuteJsPlugin {}
  interface Tab extends IExecuteJsPlugin {}
  interface FrameEnvironment extends IExecuteJsPlugin {}
}

export { ClientPlugin, CorePlugin };

export default { ClientPlugin, CorePlugin };
