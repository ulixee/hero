import { AddressInfo } from 'net';

process.env.ENVIRONMENT = process.env.ENVIRONMENT || 'development';
import 'source-map-support/register';
import * as http from 'http';
import commandLineArgs from 'command-line-args';
import server from './server';

process.title = `SecretAgent-ReplayApi`;

////////////////////////////////////////////////////////////////////////////////////////

function log(message: string) {
  // tslint:disable-next-line:no-console
  console.log(message);
}

// DETERMINE PORTS //////////////////////////////////////////////////////////////////////

const { httpPort } = (function setup() {
  const options = commandLineArgs([{ name: 'port', type: String, defaultValue: 0 }]);
  return { httpPort: options.port };
})();

// LISTEN /////////////////////////////////////////////////////////////////////////////////

const divider = Array(100)
  .fill('-')
  .join('');
log(divider);

const httpServer = http.createServer(server);
httpServer.listen(httpPort, () => {
  const port = (httpServer.address() as AddressInfo).port;
  log(`${process.env.ENVIRONMENT.toUpperCase()} REPLAY API SERVER LISTENING on [${port}]
${divider}`);
});
