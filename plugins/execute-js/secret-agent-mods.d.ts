// This import statement is important for all this to work, otherwise we don't extend but replace the secret-agent module definition.
// https://github.com/microsoft/TypeScript/issues/10859
import {} from '@secret-agent/client';

type ExecuteJsPluginAdditions = {
  executeJs(fn: string | ((...args: any[]) => any), ...args: any[]);
};

declare module '@secret-agent/client' {
  interface Agent extends ExecuteJsPluginAdditions {}
  interface Tab extends ExecuteJsPluginAdditions {}
}
