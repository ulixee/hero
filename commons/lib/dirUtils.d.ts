export declare function getDirname(dirnameOrUrl: string): string;
export declare function getSourcedir(dirnameOrUrl: string, buildDir?: string): string | null;
export declare function getClosestPackageJson(path: string): any | undefined;
export declare function getDataDirectory(): string;
export declare function cleanHomeDir(str: string): string;
export declare function findProjectPathSync(startingDirectory: string): string;
export declare function findProjectPathAsync(startingDirectory: string): Promise<string>;
