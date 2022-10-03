import '@ulixee/commons/lib/SourceMapSupport';
import importBrowserProfiles from '@double-agent/runner/lib/importFoundationalProfiles';
import * as Fs from 'fs';
import { getExternalDataPath } from '../paths';

const profilesDir = getExternalDataPath('0-foundational-profiles');
const externalUserAgentConfig = JSON.parse(
  Fs.readFileSync(getExternalDataPath('userAgentConfig.json'), 'utf8'),
);

importBrowserProfiles(profilesDir, externalUserAgentConfig).catch(console.error);
