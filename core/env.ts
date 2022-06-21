import * as Path from 'path';
import * as Os from 'os';
import AgentEnv from '@unblocked-web/agent/env';

export default {
  disableMitm: booleanOrUndefined(process.env.ULX_DISABLE_MITM) ?? AgentEnv.disableMitm,
  showChrome: booleanOrUndefined(process.env.ULX_SHOW_CHROME) ?? AgentEnv.showChrome,
  disableDevtools: booleanOrUndefined(process.env.ULX_DISABLE_DEVTOOLS) ?? AgentEnv.disableDevtools,
  noChromeSandbox:
    booleanOrUndefined(process.env.ULX_NO_CHROME_SANDBOX) ?? AgentEnv.noChromeSandbox,
  disableGpu: booleanOrUndefined(process.env.ULX_DISABLE_GPU) ?? AgentEnv.disableGpu,
};

export const dataDir = process.env.ULX_DATA_DIR || Path.join(Os.tmpdir(), '.ulixee'); // transferred to static variable below class definition

function booleanOrUndefined(envValue): boolean | undefined {
  if (envValue === undefined) return undefined;
  return Boolean(typeof envValue === 'string' ? JSON.parse(envValue.toLowerCase()) : envValue);
}
