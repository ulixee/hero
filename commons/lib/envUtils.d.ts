/**
 * Will load env files with this precedence (.env.defaults, .env.<NODE_ENV>, .env)
 */
export declare function loadEnv(baseDir: string, overwriteSetValues?: boolean): void;
export declare function applyEnvironmentVariables(path: string, env: Record<string, string>): void;
export declare function parseEnvList(envvar: string): string[];
export declare function parseEnvInt(envvar: string): number | null;
export declare function parseEnvPath(envvar: string, relativeTo?: string): string | undefined;
export declare function parseEnvBool(envvar: string): boolean | undefined;
export declare function parseEnvBigint(envvar: string): bigint | null;
