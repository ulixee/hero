export default class TypeSerializer {
    static errorTypes: Map<string, new (message?: string) => Error>;
    private static isNodejs;
    static parse(stringified: string, stackMarker?: string): any;
    static revive(object: any, objectKey?: string): any;
    static stringify<T>(object: T, options?: {
        ignoreProperties?: (keyof T)[];
        sortKeys?: boolean;
        format?: boolean;
    }): string;
    static replace<T>(object: T, options?: {
        ignoreProperties?: (keyof T)[];
        sortKeys?: boolean;
    }): unknown;
    private static typeReplacer;
    private static Uint8ArrayToBase64String;
    private static base64StringToUint8Array;
    private static reviver;
}
export declare function registerSerializableErrorType(errorConstructor: {
    new (...args: any[]): Error;
}): void;
export declare const stringifiedTypeSerializerClass: string;
