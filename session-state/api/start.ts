import 'source-map-support/register';
import { createReplayServer } from './index';

process.title = `SecretAgent-ReplayApi`;
const nodeEnv = process.env.NODE_ENV ?? 'development';

const divider = Array(100)
  .fill('-')
  .join('');
const port = Number(process.env.SA_SESSION_API_PORT ?? 0);

console.log(divider);

createReplayServer(port).then(server => {
  console.log(`${nodeEnv.toUpperCase()} REPLAY API SERVER LISTENING on [${server.port}]`);
  console.log(divider);
});
