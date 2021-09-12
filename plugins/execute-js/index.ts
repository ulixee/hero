// This import statement is important for all this to work, otherwise we don't extend but replace the ulixee module definition.
// https://github.com/microsoft/TypeScript/issues/10859
import type {} from '@ulixee/hero/lib/Hero';
import type {} from '@ulixee/hero/lib/Tab';
import ClientPlugin from './lib/ClientPlugin';
import CorePlugin from './lib/CorePlugin';

declare module '@ulixee/hero/lib/Hero' {
  interface Hero {
    executeJs(fn: string | ((...args: any[]) => any), ...args: any[]);
  }
}

declare module '@ulixee/hero/lib/Tab' {
  interface Tab {
    executeJs(fn: string | ((...args: any[]) => any), ...args: any[]);
  }
}

export { ClientPlugin, CorePlugin };

export default { ClientPlugin, CorePlugin };
