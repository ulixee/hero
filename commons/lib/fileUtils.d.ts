export declare function existsAsync(path: string): Promise<boolean>;
export declare function copyDir(fromDir: string, toDir: string): Promise<void>;
export declare function readFileAsJson<T>(path: string): Promise<T | null>;
export declare function safeOverwriteFile(path: string, body: any): Promise<void>;
export declare function cleanHomeDir(str: string): string;
