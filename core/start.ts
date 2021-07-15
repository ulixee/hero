import '@ulixee/commons/SourceMapSupport';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import Log from '@ulixee/commons/Logger';
import Core from '.';

const { log } = Log(module);

(async () => {
  const startOptions: ICoreConfigureOptions =
    process.argv.length > 2 ? JSON.parse(process.argv[2]) : {};

  Core.onShutdown = () => {
    log.stats('Exiting Core Process');
    process.exit();
  };
  await Core.start(startOptions, !process.env.HERO_TEMPORARY_CORE);
})().catch(error => {
  log.error('ERROR starting core', {
    error,
    sessionId: null,
  });
  process.exit(1);
});
