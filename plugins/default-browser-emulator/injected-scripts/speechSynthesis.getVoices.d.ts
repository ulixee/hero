import type { ScriptInput } from './_utils';
export type Args = {
    voices: any;
};
export declare function main({ args, utils: { replaceFunction, ReflectCached, ObjectCached, replaceGetter }, }: ScriptInput<Args>): void;
