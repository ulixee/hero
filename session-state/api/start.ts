import 'source-map-support/register';
import readline from 'readline';
import { createReplayServer } from './index';

process.title = `SecretAgent-ReplayApi`;
const nodeEnv = process.env.NODE_ENV ?? 'development';

const divider = Array(100).fill('-').join('');
const port = Number(process.env.SA_SESSION_API_PORT ?? 0);

function log(message: string) {
  // eslint-disable-next-line  no-console
  console.log(message);
}

if (process.platform === 'win32') {
  readline
    .createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    .once('SIGINT', () => process.emit('SIGINT' as any));
}

log(divider);

(async () => {
  try {
    const server = await createReplayServer(port);
    log(`${nodeEnv.toUpperCase()} REPLAY API SERVER LISTENING on [${server.port}]`);
    log(divider);

    ['exit', 'SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(name => {
      process.on(name as any, () => {
        log(`Shutting down with REPLAY API signal: ${name}`);
        server.close(false);
        process.exit();
      });
    });
    return null;
  } catch (error) {
    log(`${nodeEnv.toUpperCase()} ERROR starting replay api ${error}`);
  }
})();
