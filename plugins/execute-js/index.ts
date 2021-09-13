// This import statement is important for all this to work, otherwise we don't extend but replace the ulixee module definition.
// https://github.com/microsoft/TypeScript/issues/10859
import type {} from '@ulixee/hero/lib/extendables';
import ClientPlugin from './lib/ClientPlugin';
import CorePlugin from './lib/CorePlugin';

declare module '@ulixee/hero/lib/extendables' {
  interface Hero {
    executeJs(fn: string | ((...args: any[]) => any), ...args: any[]);
  }
  interface Tab {
    executeJs(fn: string | ((...args: any[]) => any), ...args: any[]);
  }
}

export { ClientPlugin, CorePlugin };

export default { ClientPlugin, CorePlugin };
