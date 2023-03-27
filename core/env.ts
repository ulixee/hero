import AgentEnv from '@ulixee/unblocked-agent/env';
import { loadEnv, parseEnvBool, parseEnvPath } from '@ulixee/commons/lib/envUtils';

loadEnv(__dirname);
const env = process.env;
if (env.ULX_DATA_DIR) env.ULX_DATA_DIR = parseEnvPath(env.ULX_DATA_DIR);

export default {
  disableMitm: parseEnvBool(env.ULX_DISABLE_MITM) ?? AgentEnv.disableMitm,
  showChrome: parseEnvBool(env.ULX_SHOW_CHROME) ?? AgentEnv.showChrome,
  noChromeSandbox: parseEnvBool(env.ULX_NO_CHROME_SANDBOX) ?? AgentEnv.noChromeSandbox,
  disableGpu: parseEnvBool(env.ULX_DISABLE_GPU) ?? AgentEnv.disableGpu,
  enableSqliteWal: parseEnvBool(env.ULX_ENABLE_SQLITE_WAL) ?? false,
};

export const dataDir = env.ULX_DATA_DIR;
