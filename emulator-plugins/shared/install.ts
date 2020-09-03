import EngineInstaller from '@secret-agent/puppet-chrome/install/EngineInstaller';

export default function install(engine: { browser: string; revision: string }) {
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
