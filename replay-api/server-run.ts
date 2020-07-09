process.env.ENVIRONMENT = process.env.ENVIRONMENT || 'development';
import 'source-map-support/register';
import * as http from 'http';
import commandLineArgs from 'command-line-args';
import server from './server';

////////////////////////////////////////////////////////////////////////////////////////

const isProduction = process.env.ENVIRONMENT === 'production';

// DETERMINE PORTS //////////////////////////////////////////////////////////////////////

const { httpPort } = (function setup() {
  const options = commandLineArgs([{ name: 'port', type: String, defaultValue: 1212 }]);
  return { httpPort: options.port };
})();

// LISTEN /////////////////////////////////////////////////////////////////////////////////

const divider = Array(100)
  .fill('-')
  .join('');
console.log(divider);

const httpServer = http.createServer(server.callback());
httpServer.listen(httpPort, () => {
  console.log(`${process.env.ENVIRONMENT.toUpperCase()} SERVER LISTENING on ${httpPort}`);
  console.log(divider);
});
