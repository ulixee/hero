import 'source-map-support/register';
import { createReplayServer } from './index';

process.title = `SecretAgent-ReplayApi`;
const nodeEnv = process.env.NODE_ENV ?? 'development';

const divider = Array(100)
  .fill('-')
  .join('');
const port = Number(process.env.SA_SESSION_API_PORT ?? 0);

function log(message: string) {
  // eslint-disable-next-line  no-console
  console.log(message);
}

log(divider);

createReplayServer(port)
  .then(server => {
    log(`${nodeEnv.toUpperCase()} REPLAY API SERVER LISTENING on [${server.port}]`);
    log(divider);
    return null;
  })
  .catch(error => {
    log(`${nodeEnv.toUpperCase()} ERROR starting replay api ${error}`);
  });
