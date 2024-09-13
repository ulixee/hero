import * as http2 from 'http2';
import Certs from './Certs';
import createHttpRequestHandler from '../lib/createHttpRequestHandler';
import createWebsocketHandler from '../lib/createWebsocketHandler';
import IServerContext from '../interfaces/IServerContext';
import BaseServer from './BaseServer';
import { IRoutesByPath } from '../lib/Plugin';

export interface IHttp2SessionActivity {
  type: string;
  data?: any;
}

export default class Http2Server extends BaseServer {
  public sessions: {
    session: http2.ServerHttp2Session;
    id: string;
    activity: IHttp2SessionActivity[];
  }[] = [];

  private http2Server: http2.Http2SecureServer;

  constructor(port: number, routesByPath: IRoutesByPath) {
    super('http2', port, routesByPath);
  }

  public override async start(context: IServerContext): Promise<this> {
    await super.start(context);
    const httpRequestHandler = createHttpRequestHandler(this, context);
    const websocketHandler = createWebsocketHandler(this, context);
    const options = <http2.SecureServerOptions>{
      ...Certs(),
      allowHTTP1: true, // allow http1 for older browsers
    };

    this.http2Server = await new Promise<http2.Http2SecureServer>((resolve) => {
      const server = http2.createSecureServer(options, httpRequestHandler);
      server.on('upgrade', websocketHandler);
      server.on('checkContinue', (request, response) => {
        const session = this.sessions.find((x) => x.session === request.stream.session);
        session.activity.push({
          type: 'checkContinue',
          data: {
            remoteWindowSize: session.session?.state?.remoteWindowSize,
            headers: request.headers,
          },
        });
        response.writeContinue();
      });
      server.on('session', (session) => {
        const sessionActivity = {
          session,
          id: `${session.socket.remoteAddress}:${session.socket.remotePort}`,
          activity: [] as IHttp2SessionActivity[],
        };
        const activity = sessionActivity.activity;
        session.on('connect', () => {
          activity.push({
            type: 'connect',
            data: {
              remoteWindowSize: session.state?.remoteWindowSize,
            },
          });
        });

        this.sessions.push(sessionActivity);
        session.on('ping', (bytes) => {
          activity.push({
            type: 'ping',
            data: bytes.toString('utf8'),
          });
        });
        session.on('close', () => {
          activity.push({
            type: 'close',
            data: {
              remoteWindowSize: session.state?.remoteWindowSize,
            },
          });
        });
        session.on('frameError', (frameType: number, errorCode: number, streamID: number) => {
          activity.push({
            type: 'frameError',
            data: {
              frameType,
              errorCode,
              streamID,
              remoteWindowSize: session.state?.remoteWindowSize,
            },
          });
        });
        session.on('remoteSettings', (remoteSettings) => {
          const settings: any = {};
          for (const [key, value] of Object.entries(http2.getDefaultSettings())) {
            // aliased property
            if (key === 'maxHeaderSize') continue;
            if (remoteSettings[key] !== value) {
              settings[key] = remoteSettings[key];
            }
          }
          activity.push({
            type: 'remoteSettings',
            data: {
              settings,
              remoteWindowSize: session.state?.remoteWindowSize,
            },
          });
        });
        session.on('localSettings', (settings) => {
          activity.push({
            type: 'localSettings',
            data: {
              settings,
              remoteWindowSize: session.state?.remoteWindowSize,
            },
          });
        });
        session.on('goaway', (errorCode: number, lastStreamID: number, opaqueData: Buffer) => {
          activity.push({
            type: 'goaway',
            data: {
              errorCode,
              lastStreamID,
              opaqueData,
              remoteWindowSize: session.state?.remoteWindowSize,
            },
          });
        });
        session.on('stream', (stream, headers, flags) => {
          activity.push({
            type: 'stream',
            data: {
              id: stream.id,
              authority: headers[':authority'],
              method: headers[':method'],
              scheme: headers[':scheme'],
              path: headers[':path'],
              flags,
              weight: stream.state.weight,
              hpackOutboundSize: session.state.deflateDynamicTableSize,
              hpackInboundSize: session.state.inflateDynamicTableSize,
              remoteWindowSize: session.state.remoteWindowSize,
            },
          });
          stream.on('streamClosed', (code) => {
            activity.push({
              type: 'streamClosed',
              data: { code, remoteWindowSize: session.state?.remoteWindowSize },
            });
          });
          stream.on('trailers', (trailers, trailerFlags) => {
            activity.push({
              type: 'trailers',
              data: {
                trailers,
                flags: trailerFlags,
                remoteWindowSize: session.state?.remoteWindowSize,
              },
            });
          });
        });
      });
      server.listen(this.port, () => resolve(server));
    });

    return this;
  }

  public async stop(): Promise<any> {
    this.sessions.forEach((x) => x.session.close());
    this.http2Server.close();
    console.log(`HTTPS Server closed (port: ${this.port}`);
  }
}
