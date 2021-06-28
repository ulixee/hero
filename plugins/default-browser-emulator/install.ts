import install from '@secret-agent/plugin-utils/install';
import * as browserEngineOptions from './data/browserEngineOptions.json';
import { latestBrowserEngineId } from './index';

const browserEngineOption = browserEngineOptions.find(x => x.id === latestBrowserEngineId);
install({
  name: browserEngineOption.name,
  fullVersion: browserEngineOption.fullVersion,
  executablePathEnvVar: browserEngineOption.executablePathEnvVar,
});
