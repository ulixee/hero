import installEngineWithProgress from '@secret-agent/puppet/lib/installEngineWithProgress';
import { IBrowserEngineConfig } from '@secret-agent/interfaces/IBrowserEngine';

export default function install(engine: IBrowserEngineConfig) {
  installEngineWithProgress(engine).catch(error => {
    console.log('ERROR installing engine', error);
    process.exit(1);
  });
}
