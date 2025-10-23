import type { ScriptInput } from './_utils';
export type Args = {
    unAvailHeight?: number;
    unAvailWidth?: number;
    colorDepth?: number;
};
export declare function main({ args, utils: { replaceGetter } }: ScriptInput<Args>): void;
