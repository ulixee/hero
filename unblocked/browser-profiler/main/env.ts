import '@ulixee/commons/lib/SourceMapSupport';
import { loadEnv, parseEnvBool } from '@ulixee/commons/lib/envUtils';
import * as Path from 'path';

loadEnv(Path.resolve(__dirname, '..'));
const { env } = process;
export default {
  browserStackUser: env.BROWSERSTACK_USER,
  browserStackKey: env.BROWSERSTACK_ACCESS_KEY,
  browserStackLocal: parseEnvBool(env.BROWSERSTACK_LOCAL),
};
