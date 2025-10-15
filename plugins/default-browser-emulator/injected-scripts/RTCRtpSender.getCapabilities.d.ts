import type { ScriptInput } from './_utils';
export type Args = {
    audioCodecs: any;
    videoCodecs: any;
};
export declare function main({ args, utils: { replaceFunction } }: ScriptInput<Args>): void;
