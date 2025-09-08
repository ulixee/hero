import type { ScriptInput } from './_utils';
export type Args = {
    itemsToRemove: any[];
};
export declare function main({ args, utils: { getObjectAtPath } }: ScriptInput<Args>): void;
