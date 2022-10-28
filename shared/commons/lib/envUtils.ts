import * as Fs from 'fs';
import * as Path from 'path';
import * as Os from 'os';
import { getCacheDirectory } from './dirUtils';

/**
 * Will load env files with this precedence (.env.defaults, .env.<NODE_ENV>, .env)
 */
export function loadEnv(baseDir: string, overwriteSetValues = false): void {
  const envName = process.env.NODE_ENV?.toLowerCase() ?? 'development';
  const env: Record<string, string> = {};
  for (const envFile of ['.env.defaults', `.env.${envName}`, '.env']) {
    const path = Path.join(baseDir, envFile);
    if (!Fs.existsSync(path)) continue;
    applyEnvironmentVariables(path, env);
  }
  // don't overwrite already set variables
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] && !overwriteSetValues) continue;
    process.env[key] = value;
  }
}

// NOTE: imported from dotenv
export function applyEnvironmentVariables(path: string, env: Record<string, string>): void {
  let lines = Fs.readFileSync(path, 'utf8');
  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/gm, '\n');

  const LineRegex =
    /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

  let match: RegExpExecArray;
  // eslint-disable-next-line no-cond-assign
  while ((match = LineRegex.exec(lines))) {
    // eslint-disable-next-line prefer-const
    let [, key, value] = match;

    value = (value ?? '').trim();

    const StripSurroundingQuotesRegex = /^(['"`])([\s\S]*)\1$/gm;
    const isQuoted = StripSurroundingQuotesRegex.test(value);

    value = value.replace(StripSurroundingQuotesRegex, '$2');

    if (isQuoted) {
      // Expand newlines if double quoted
      value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }

    if (value === '') {
      delete env[key];
    } else {
      env[key] = value;
    }
  }
}

export function parseEnvList(envvar: string): string[] {
  if (!envvar) return [];
  return envvar.split(',').map(x => x.trim());
}

export function parseEnvInt(envvar: string): number | null {
  if (!envvar) return null;
  return parseInt(envvar, 10);
}

export function parseEnvPath(envvar: string, relativeTo?: string): string {
  if (!envvar) return undefined;
  if (envvar?.startsWith('~')) envvar = Path.join(Os.homedir(), envvar.slice(1));
  if (envvar?.startsWith('<CACHE>')) envvar = envvar.replace('<CACHE>', getCacheDirectory());
  if (envvar?.startsWith('<TMP>')) envvar = envvar.replace('<TMP>', Os.tmpdir());
  if (Path.isAbsolute(envvar)) return envvar;
  return Path.resolve(relativeTo ?? process.cwd(), envvar);
}

export function parseEnvBool(envvar: string): boolean | undefined {
  if (envvar === null || envvar === undefined) return undefined;
  if (envvar === '1' || envvar?.toLowerCase() === 'true' || envvar?.toLowerCase() === 'yes')
    return true;
  if (envvar === '0' || envvar?.toLowerCase() === 'false' || envvar?.toLowerCase() === 'no') {
    return false;
  }
}

export function parseEnvBigint(envvar: string): bigint | null {
  if (!envvar) return null;
  if (envvar.includes('e')) {
    const [number, exp] = envvar.split('e');
    const decimal = Number(`1${exp}`);
    return BigInt(number) * BigInt(decimal);
  }
  return BigInt(envvar);
}
