import pkg from './package.json';
import EngineInstaller from '@secret-agent/emulator-plugins-shared/EngineInstaller';

new EngineInstaller(pkg.engine).install().then(() => {
  process.exit();
});
