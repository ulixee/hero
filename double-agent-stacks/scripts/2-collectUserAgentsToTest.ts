import '@ulixee/commons/lib/SourceMapSupport';
import { writeUserAgentsToTest } from '@double-agent/runner/lib/collectUserAgentsToTest';
import * as Fs from 'fs';
import { getExternalDataPath } from '../paths';

const externalUserAgentsToTestDir = getExternalDataPath('/2-user-agents-to-test/userAgentsToTest');
const externalUserAgentConfig = JSON.parse(
  Fs.readFileSync(getExternalDataPath('userAgentConfig.json'), 'utf8'),
);
writeUserAgentsToTest(externalUserAgentConfig, externalUserAgentsToTestDir).catch(console.error);
