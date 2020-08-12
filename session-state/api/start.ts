import 'source-map-support/register';
import { createReplayServer } from './index';

process.title = `SecretAgent-ReplayApi`;
const nodeEnv = process.env.NODE_ENV ?? 'development';

const divider = Array(100)
  .fill('-')
  .join('');

const server = createReplayServer();

console.log(divider);
server.listen(Number(process.env.SA_SESSION_API_PORT ?? 0)).then(address => {
  console.log(`${nodeEnv.toUpperCase()} REPLAY API SERVER LISTENING on [${address.port}]`);
  console.log(divider);
});
