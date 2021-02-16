import EngineInstaller from '@secret-agent/puppet/lib/EngineInstaller';
import { IBrowserEngineConfig } from '@secret-agent/core-interfaces/IBrowserEngine';

export default function install(engine: IBrowserEngineConfig) {
  new EngineInstaller(engine)
    .install()
    .then(() => {
      process.exit();
      return null;
    })
    .catch(error => {
      console.log('ERROR installing engine', error);
      process.exit(1);
    });
}
