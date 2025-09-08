import type { ScriptInput } from './_utils';
export type Args = {
    deviceId?: string;
    groupId?: string;
};
export declare function main({ args, utils: { replaceFunction, ReflectCached } }: ScriptInput<Args>): void;
