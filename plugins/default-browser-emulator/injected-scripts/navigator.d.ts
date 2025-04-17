import type { ScriptInput } from './_utils';
export type Args = {
    userAgentString: string;
    platform: string;
    headless: boolean;
    pdfViewerEnabled: boolean;
    userAgentData: any;
    rtt: number;
};
export declare function main({ args, utils: { replaceGetter, ObjectCached, replaceFunction, ReflectCached }, }: ScriptInput<Args>): void;
