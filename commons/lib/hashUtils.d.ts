export declare const hashMessagePrefix = "\u0018Ulixee Signed Message:\n";
export declare function sha256(data: Buffer | string): Buffer;
export declare function sortedJsonStringify<T>(obj: T | null, ignoreProperties?: (keyof T)[]): string;
export declare function hashObject<T>(obj: T, options?: {
    prefix?: Buffer;
    ignoreProperties?: (keyof T)[];
}): Buffer;
