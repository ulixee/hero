import '@ulixee/commons/lib/SourceMapSupport';
import * as https from 'https';
import * as tls from 'tls';
import { IncomingMessage, ServerResponse } from 'http';

const minMillisBetweenConnects = 5e3;

let connectionCount = 0;
let lastConnectionDate: Date;
let activeConnection: { id: number; req: IncomingMessage; res: ServerResponse };

process.on('message', (message: any) => {
  if (message.start) {
    const options = message.start;
    if (options.key) options.key = Buffer.from(options.key);
    if (options.cert) options.cert = Buffer.from(options.cert);
    start(options);
  } else if (message.response) {
    const { response } = message;
    if (!activeConnection || activeConnection.id !== response.connectionId) {
      process.send({ error: `ConnectionId could not be found: ${response.connectionId}` });
      return;
    }
    activeConnection.res.end(response.body);
    const millisWait = millisUntilNextConnect();
    setTimeout(reset, millisWait);
  }
});

function millisUntilNextConnect(): number {
  const currentDate = new Date();
  const elapsedMillis = Number(currentDate) - Number(lastConnectionDate);
  return elapsedMillis >= minMillisBetweenConnects ? 0 : minMillisBetweenConnects - elapsedMillis;
}

function reset(): void {
  const millisWait = millisUntilNextConnect();
  if (millisWait) {
    setTimeout(reset, millisWait);
  } else {
    activeConnection = undefined;
    process.send({ reset: true });
  }
}

function start(options: { port: number; key?: string; cert?: string }): void {
  try {
    const port = options.port;
    delete options.port;

    Object.assign(options, {
      enableTrace: true,
      sessionTimeout: 10,
    });
    const childServer = https.createServer(options, onConnection);

    childServer.on('error', (err) => {
      process.send({ error: err.message });
      console.log(err);
    });

    childServer.listen(port, () => {
      process.send({ started: true });
    });
  } catch (err) {
    console.log(err);
  }
}

async function onConnection(req, res): Promise<void> {
  lastConnectionDate = new Date();
  res.connection.setKeepAlive(false);

  if (activeConnection && req.url === '/favicon.ico') {
    process.send({ favicon: true });
    res.end(`Favicon`);
    return;
  }
  if (activeConnection) {
    res.end(`Overloaded. Try again in ${minMillisBetweenConnects / 1000} seconds`);
    process.send({ overloaded: true });
    return;
  }

  const connectionId = (connectionCount += 1); // eslint-disable-line no-multi-assign
  activeConnection = { id: connectionId, req, res };

  try {
    const { remoteAddress, remotePort } = req.connection;
    const secureSocket = req.connection as tls.TLSSocket;
    const request = {
      connectionId,
      connection: {
        remoteAddress,
        remotePort,
      },
      socket: {
        remoteAddress,
        remotePort,
      },
      url: req.url,
      method: req.method,
      headers: req.headers,
      rawHeaders: req.rawHeaders,
      alpnProtocol: secureSocket.alpnProtocol,
      cipherName: secureSocket.getCipher()?.name,
      tlsProtocol: secureSocket.getProtocol(),
    };
    process.send({ request });
  } catch (err) {
    process.send({ error: 'Error servicing request' });
    console.log('Error servicing request', err);
  }
}
