import install from '@secret-agent/emulate-browsers-base/install';
import config from './config.json';

install({
  browser: config.browserEngine.name,
  revision: config.browserEngine.revision,
});
