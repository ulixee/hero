import { loadEnv, parseEnvBool, parseEnvPath } from '@ulixee/commons/lib/envUtils';

loadEnv(__dirname);

const env = process.env;
const envDebug = env.DEBUG ?? '';
if(env.UBK_DATA_DIR) env.UBK_DATA_DIR = parseEnvPath(env.UBK_DATA_DIR);
if(env.UBK_NETWORK_DIR) env.UBK_NETWORK_DIR = parseEnvPath(env.UBK_NETWORK_DIR);

export default {
  sslKeylogFile: env.SSLKEYLOGFILE,
  // TODO: this is insecure by default because golang 1.14 has an issue verifying certain certificate authorities:
  // https://github.com/golang/go/issues/24652
  // https://github.com/golang/go/issues/38365
  allowInsecure: parseEnvBool(env.UBK_MITM_ALLOW_INSECURE),
  enableMitmCache: parseEnvBool(env.UBK_MITM_ENABLED_CACHE),
  defaultStorageDirectory: env.UBK_NETWORK_DIR ?? env.UBK_DATA_DIR,
  isDebug:
    envDebug.includes('ubk:*') ||
    envDebug.includes('ubk*') ||
    envDebug === '*' ||
    envDebug.includes('ubk:mitm'),
};
