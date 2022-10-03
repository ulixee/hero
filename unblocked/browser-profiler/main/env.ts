import '@ulixee/commons/lib/SourceMapSupport';
import { loadEnv } from '@ulixee/commons/lib/envUtils';
import * as Path from 'path';
import * as Os from 'os';

loadEnv(Path.resolve(__dirname,'..'));
const { env } = process;

export default {
  browserStackUser: env.BROWSERSTACK_USER,
  browserStackKey: env.BROWSERSTACK_ACCESS_KEY,
};

export function parseEnvPath(envvar: string, relativeTo?: string): string {
  if (!envvar) return null;
  if (envvar?.startsWith('~')) envvar = Path.join(Os.homedir(), envvar.slice(1));
  if (Path.isAbsolute(envvar)) return envvar;
  return Path.resolve(relativeTo ?? process.cwd(), envvar);
}
