import install from '@secret-agent/emulate-browsers-base/install';
import * as config from './config.json';

install({
  name: config.browserEngine.name,
  fullVersion: config.browserEngine.fullVersion,
  executablePathEnvVar: config.browserEngine.executablePathEnvVar,
});
