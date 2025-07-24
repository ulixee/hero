import type { ScriptInput } from './_utils';
export type Args = Record<string, string | number | boolean>;
export declare function main({ args, utils: { ReflectCached, replaceFunction } }: ScriptInput<Args>): void;
