import RequestSession from './RequestSession';
import { RequestOptions } from 'https';
import { ClientRequestArgs } from 'http';
import Log from '@secret-agent/commons/Logger';
import SocketConnectDriver from '../lib/SocketConnectDriver';

const { log } = Log(module);

export default class SocketHandler {
  public static async createConnection(
    session: RequestSession,
    options: RequestOptions,
    isSSL: boolean,
    isWebsocket: boolean = false,
  ) {
    if (process.env.MITM_ALLOW_INSECURE) {
      (options as RequestOptions).rejectUnauthorized = false;
    }

    const tlsProfileId = session.delegate.tlsProfileId;
    const connectDriver = new SocketConnectDriver(session.sessionId, {
      host: options.host,
      port: String(options.port),
      isSsl: isSSL,
      servername: options.servername || options.host,
      rejectUnauthorized: options.rejectUnauthorized,
      clientHelloId: tlsProfileId,
    });

    if (isWebsocket) {
      connectDriver.connectOpts.keepAlive = true;
    }

    const tcpVars = session.delegate.tcpVars;
    if (tcpVars) connectDriver.setTcpSettings(tcpVars);

    const proxyUrl = await session?.getUpstreamProxyUrl();
    if (proxyUrl) connectDriver.setProxy(proxyUrl);

    session.socketConnects.push(connectDriver);
    await connectDriver.connect();

    connectDriver.on('close', SocketHandler.removeSocketConnect.bind(this, session, connectDriver));

    if (isWebsocket) {
      connectDriver.socket.setNoDelay(true);
      connectDriver.socket.setTimeout(0);
    }
    return connectDriver;
  }

  private static removeSocketConnect(session: RequestSession, socket: SocketConnectDriver) {
    const idx = session.socketConnects.indexOf(socket);
    if (idx >= 0) session.socketConnects.splice(idx, 1);
  }
}
