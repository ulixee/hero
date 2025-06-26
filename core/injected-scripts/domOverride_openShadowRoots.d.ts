import type { ScriptInput } from '@ulixee/default-browser-emulator/injected-scripts/_utils';
export type Args = {
    callbackName: string;
};
export declare function main({ callback, args, utils: { replaceGetter, replaceFunction, ReflectCached }, }: ScriptInput<Args>): void;
