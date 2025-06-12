import type { ScriptInput } from './_utils';
export type Args = {
    callbackName: string;
};
export declare function main({ args, callback, utils: { replaceSetter, ReflectCached }, }: ScriptInput<Args>): void;
