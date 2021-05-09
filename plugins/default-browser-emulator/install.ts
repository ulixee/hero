import install from '@secret-agent/plugin-utils/install';
import * as browserEngineOptions from './data/browserEngineOptions.json';

const browserEngineOption = browserEngineOptions[0];
install({
  name: browserEngineOption.name,
  fullVersion: browserEngineOption.fullVersion,
  executablePathEnvVar: browserEngineOption.executablePathEnvVar,
});
