import type { ScriptInput } from './_utils';
export type Args = {
    concurrency: number;
};
export declare function main({ args, utils: { replaceGetter } }: ScriptInput<Args>): void;
