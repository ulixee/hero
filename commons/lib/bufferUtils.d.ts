export declare function concatAsBuffer(...items: (string | number | Buffer)[]): Buffer;
export declare function bufferToBigInt(buffer: Buffer): bigint;
export declare function xor(a: Buffer, b: Buffer): Buffer;
export declare function bufferReplacer(key: string, value: any): any;
export declare function encodeBuffer(digest: Buffer, prefix: string): string;
export declare function decodeBuffer(encoded: string, expectedPrefix: string): Buffer;
export declare function decompressBuffer(buffer: Buffer, encoding: string): Promise<Buffer>;
