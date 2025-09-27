import ClientPlugin from './lib/ClientPlugin';
import CorePlugin from './lib/CorePlugin';
interface IExecuteJsPlugin {
    executeJs<T extends any[]>(fn: string | ((...args: T) => any), ...args: T): any;
}
declare module '@ulixee/hero/lib/extendables' {
    interface Hero extends IExecuteJsPlugin {
    }
    interface Tab extends IExecuteJsPlugin {
    }
    interface FrameEnvironment extends IExecuteJsPlugin {
    }
}
export { ClientPlugin, CorePlugin };
declare const _default: {
    ClientPlugin: typeof ClientPlugin;
    CorePlugin: typeof CorePlugin;
};
export default _default;
