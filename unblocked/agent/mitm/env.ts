import { loadEnv, parseEnvBool, parseEnvPath } from '@ulixee/commons/lib/envUtils';

loadEnv(__dirname);

const env = process.env;
const envDebug = env.DEBUG ?? '';
if(env.ULX_DATA_DIR) env.ULX_DATA_DIR = parseEnvPath(env.ULX_DATA_DIR);
if(env.ULX_NETWORK_DIR) env.ULX_NETWORK_DIR = parseEnvPath(env.ULX_NETWORK_DIR);

export default {
  sslKeylogFile: env.SSLKEYLOGFILE,
  // TODO: this is insecure by default because golang 1.14 has an issue verifying certain certificate authorities:
  // https://github.com/golang/go/issues/24652
  // https://github.com/golang/go/issues/38365
  allowInsecure: parseEnvBool(env.ULX_MITM_ALLOW_INSECURE),
  enableMitmCache: parseEnvBool(env.ULX_MITM_ENABLED_CACHE),
  defaultStorageDirectory: env.ULX_NETWORK_DIR ?? env.ULX_DATA_DIR,
  isDebug:
    envDebug.includes('ulx:*') ||
    envDebug.includes('ulx*') ||
    envDebug === '*' ||
    envDebug.includes('ulx:mitm'),
};
