import EngineInstaller from './lib/EngineInstaller';

export default function install(engine: { browser: string; revision: string }) {
  new EngineInstaller(engine)
    .install()
    // eslint-disable-next-line promise/always-return
    .then(() => {
      process.exit();
    })
    .catch(error => {
      console.log('ERROR installing engine', error);
      process.exit(1);
    });
}
