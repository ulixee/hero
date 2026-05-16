import type { ScriptInput } from './_utils';
export type Args = {
    preventDefaultUncaughtError: boolean;
    preventDefaultUnhandledRejection: boolean;
};
export declare function main({ args, utils: { replaceFunction, ReflectCached, replaceGetter }, }: ScriptInput<Args>): void;
