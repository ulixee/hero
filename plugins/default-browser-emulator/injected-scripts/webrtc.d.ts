import type { ScriptInput } from './_utils';
export type Args = {
    localIp: string;
    proxyIp: string;
};
export declare function main({ args, utils: { replaceFunction, replaceGetter, ReflectCached }, }: ScriptInput<Args>): void;
