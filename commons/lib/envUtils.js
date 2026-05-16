"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
exports.applyEnvironmentVariables = applyEnvironmentVariables;
exports.parseEnvList = parseEnvList;
exports.parseEnvInt = parseEnvInt;
exports.parseEnvPath = parseEnvPath;
exports.parseEnvBool = parseEnvBool;
exports.parseEnvBigint = parseEnvBigint;
const Fs = require("fs");
const Os = require("os");
const Path = require("path");
const dirUtils_1 = require("./dirUtils");
/**
 * Will load env files with this precedence (.env.defaults, .env.<NODE_ENV>, .env)
 */
function loadEnv(baseDir, overwriteSetValues = false) {
    if (baseDir.endsWith('dist'))
        baseDir = Path.resolve(baseDir, '..');
    const envName = process.env.NODE_ENV?.toLowerCase() ?? 'development';
    const env = {};
    const argIndex = process.argv.findIndex(x => x.includes('--env'));
    if (argIndex >= 0) {
        const envFile = process.argv[argIndex].split('=')[1] ?? process.argv[argIndex + 1];
        const path = Path.resolve(envFile);
        if (Fs.existsSync(path)) {
            applyEnvironmentVariables(path, env);
        }
    }
    for (const envFile of ['.env.defaults', `.env.${envName}`, '.env']) {
        const path = Path.join(baseDir, envFile);
        if (!Fs.existsSync(path))
            continue;
        applyEnvironmentVariables(path, env);
    }
    // don't overwrite already set variables
    for (const [key, value] of Object.entries(env)) {
        if (process.env[key] && !overwriteSetValues)
            continue;
        if (!value)
            continue;
        process.env[key] = value;
    }
}
// NOTE: imported from dotenv
function applyEnvironmentVariables(path, env) {
    let lines = Fs.readFileSync(path, 'utf8');
    // Convert line breaks to same format
    lines = lines.replace(/\r\n?/gm, '\n');
    const LineRegex = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = LineRegex.exec(lines))) {
        if (!match)
            continue;
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
        }
        else {
            env[key] = value;
        }
    }
}
function parseEnvList(envvar) {
    if (!envvar)
        return [];
    return envvar.split(',').map(x => x.trim());
}
function parseEnvInt(envvar) {
    if (!envvar)
        return null;
    return parseInt(envvar, 10);
}
function parseEnvPath(envvar, relativeTo) {
    if (!envvar)
        return undefined;
    if (envvar?.startsWith('~'))
        envvar = Path.join(Os.homedir(), envvar.slice(1));
    if (envvar?.startsWith('<DATA>'))
        envvar = envvar.replace('<DATA>', (0, dirUtils_1.getDataDirectory)());
    if (envvar?.startsWith('<TMP>'))
        envvar = envvar.replace('<TMP>', Os.tmpdir());
    if (Path.isAbsolute(envvar))
        return envvar;
    return Path.resolve(relativeTo ?? process.cwd(), envvar);
}
function parseEnvBool(envvar) {
    if (envvar === null || envvar === undefined)
        return undefined;
    if (envvar === '1' || envvar?.toLowerCase() === 'true' || envvar?.toLowerCase() === 'yes')
        return true;
    if (envvar === '0' || envvar?.toLowerCase() === 'false' || envvar?.toLowerCase() === 'no') {
        return false;
    }
}
function parseEnvBigint(envvar) {
    if (!envvar)
        return null;
    if (envvar.includes('e')) {
        const [number, exp] = envvar.split('e');
        const decimal = Number(`1${exp}`);
        return BigInt(number) * BigInt(decimal);
    }
    return BigInt(envvar);
}
//# sourceMappingURL=envUtils.js.map