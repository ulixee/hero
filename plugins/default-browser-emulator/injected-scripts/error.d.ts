import type { ScriptInput } from './_utils';
export type Args = {
    fixConsoleStack: boolean;
    removeInjectedLines: boolean;
    applyStackTraceLimit: boolean;
};
export declare function main({ args, sourceUrl, utils: { ObjectCached, ReflectCached, toOriginalFn, replaceFunction }, }: ScriptInput<Args>): void;
