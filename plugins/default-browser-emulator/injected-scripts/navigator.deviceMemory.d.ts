import type { ScriptInput } from './_utils';
export type Args = {
    memory: number;
    maxHeapSize: number;
    storageTib: number;
};
export declare function main({ args, utils: { replaceGetter, replaceFunction, ReflectCached } }: ScriptInput<Args>): void;
