import 'source-map-support/register';
import ICoreConfigureOptions from '@secret-agent/core-interfaces/ICoreConfigureOptions';
import Log from '@secret-agent/commons/Logger';
import Core from '.';

const { log } = Log(module);

(async () => {
  try {
    const startOptions: ICoreConfigureOptions =
      process.argv.length > 2 ? JSON.parse(process.argv[2]) : {};

    log.info('Starting Local Core instance', {
      startOptions,
      sessionId: null,
    });

    Core.onShutdown = () => {
      log.info('Exiting Core Process');
      process.exit();
    };
    await Core.start(startOptions, !process.env.SA_TEMPORARY_CORE);
    const host = await Core.server.address;

    process.send(host);
  } catch (error) {
    log.error('ERROR starting core', {
      error,
      sessionId: null,
    });
    process.exit(1);
  }
})();
