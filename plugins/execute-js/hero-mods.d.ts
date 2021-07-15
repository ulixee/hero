// This import statement is important for all this to work, otherwise we don't extend but replace the ulixee module definition.
// https://github.com/microsoft/TypeScript/issues/10859
import {} from '@ulixee/hero';

type ExecuteJsPluginAdditions = {
  executeJs(fn: string | ((...args: any[]) => any), ...args: any[]);
};

declare module '@ulixee/hero' {
  interface Hero extends ExecuteJsPluginAdditions {}
  interface Tab extends ExecuteJsPluginAdditions {}
}
