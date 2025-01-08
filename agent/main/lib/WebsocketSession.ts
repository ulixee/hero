// import Log from '@ulixee/commons/lib/Logger';
// import Resolvable from '@ulixee/commons/lib/Resolvable';
// import TypedEventEmitter from '@ulixee/commons/lib/TypedEventEmitter';
// import {
//   IWebsocketEvents,
//   WebsocketCallback,
// } from '@ulixee/unblocked-specification/agent/browser/IWebsocketSession';
// import { IncomingMessage, createServer } from 'http';
// import { Socket, Server } from 'net';
// import { Server as WebsocketServer, type createWebSocketStream } from 'ws';

// // Not sure where to import this from
// type Websocket = Parameters<typeof createWebSocketStream>[0];

// const SCRIPT_PLACEHOLDER = '';
// const { log } = Log(module);

// export class WebsocketSession extends TypedEventEmitter<IWebsocketEvents> {
//   isReady: Resolvable<void>;

//   private readonly host = 'websocket.localhost';
//   private port: number;
//   private readonly secret = Math.random().toString();

//   // We store resolvable when we received websocket message before, receiving
//   // targetId, this way we can await this, and still trigger to get proper ids.
//   private clientIdToTargetId = new Map<string, Resolvable<string> | string>();

//   private server: Server;
//   private wss: WebsocketServer;
//   private intervals = new Set<NodeJS.Timeout>();

//   constructor() {
//     super();
//     this.server = createServer();
//     this.wss = new WebsocketServer({ noServer: true });
//   }

//   async initialize(): Promise<void> {
//     if (this.isReady) return this.isReady.promise;
//     this.isReady = new Resolvable();

//     this.server.on('error', this.isReady.reject);
//     this.server.listen(0, () => {
//       const address = this.server.address();
//       if (typeof address === 'string') {
//         throw new Error('Unexpected server address format (string)');
//       }
//       this.port = address.port;
//       this.isReady.resolve();
//     });

//     this.server.on('upgrade', this.handleUpgrade.bind(this));
//     this.wss.on('connection', this.handleConnection.bind(this));

//     return this.isReady.promise;
//   }

//   close(): void {
//     this.wss.close();
//     this.server.unref().close();
//     this.intervals.forEach(interval => clearInterval(interval));
//   }

//   isWebsocketUrl(url: string): boolean {
//     try {
//       const parsed = new URL(url);
//       return (
//         parsed.hostname === this.host
//         // parsed.port === this.port.toString() &&
//         // parsed.searchParams.get('secret') === this.secret
//       );
//     } catch {
//       return false;
//     }
//   }

//   registerWebsocketFrameId(url: string, frameId: string): void {
//     const parsed = new URL(url);
//     if (parsed.searchParams.get('secret') !== this.secret) return;
//     const clientId = parsed.searchParams.get('clientId');
//     if (!clientId) return;

//     const targetId = this.clientIdToTargetId.get(clientId);
//     if (targetId instanceof Resolvable) {
//       targetId.resolve(frameId);
//     }
//     this.clientIdToTargetId.set(clientId, frameId);
//   }

//   injectWebsocketCallbackIntoScript(script: string): string {
//     // We could do this as a simple template script but this logic might get
//     // complex over time and we want typescript to be able to check proxyScript();
//     const scriptFn = injectedScript
//       .toString()
//       // eslint-disable-next-line no-template-curly-in-string
//       .replaceAll('${this.host}', this.host)
//       // eslint-disable-next-line no-template-curly-in-string
//       .replaceAll('${this.port}', this.port.toString())
//       // eslint-disable-next-line no-template-curly-in-string
//       .replaceAll('${this.secret}', this.secret)
//       // Use function otherwise replace will try todo some magic
//       .replace('SCRIPT_PLACEHOLDER', () => script);

//     const wsScript = `(${scriptFn})();`;
//     return wsScript;
//   }

//   private handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer): void {
//     const url = new URL(request.url, `ws://${this.host}`);
//     // Close and dont send 403 so this acts as an invisible websocket server
//     if (url.searchParams.get('secret') !== this.secret) {
//       socket.destroy();
//     }

//     const clientId = url.searchParams.get('clientId');
//     this.wss.handleUpgrade(request, socket as Socket, head, ws => {
//       this.wss.emit('connection', ws, request, clientId);
//     });
//   }

//   private handleConnection(ws: Websocket, request: IncomingMessage, clientId: string): void {
//     ws.on('error', error => log.error('WebsocketSession.ConnectionError', { error }));
//     ws.on('message', this.handleMessage.bind(this, clientId));

//     let isAlive = true;
//     ws.on('pong', () => {
//       isAlive = true;
//     });

//     const interval = setInterval(() => {
//       if (isAlive) {
//         isAlive = false;
//         return ws.ping();
//       }

//       this.clientIdToTargetId.delete(clientId);
//       ws.terminate();
//       clearInterval(interval);
//       this.intervals.delete(interval);
//     }, 30e3).unref();

//     this.intervals.add(interval);
//   }

//   private async handleMessage(clientId: string, data: Buffer): Promise<void> {
//     const { name, payload } = JSON.parse(data.toString());
//     let frameId = this.clientIdToTargetId.get(clientId);
//     if (!frameId) {
//       const resolvable = new Resolvable<string>();
//       this.clientIdToTargetId.set(clientId, resolvable);
//       frameId = await resolvable.promise;
//     } else if (frameId instanceof Resolvable) {
//       frameId = await frameId.promise;
//     }

//     this.emit('message-received', { id: frameId, name, payload });
//   }
// }

// /** This function will be stringified and inserted as a wrapper script so all injected
//  * scripts have access to a callback function (over a websocket). This function takes
//  * care of setting up that websocket and all other logic it needs as glue to make it all work.
//  * */
// function injectedScript(): void {
//   const clientId = Math.random();
//   const url = `${this.host}:${this.port}?secret=${this.secret}&clientId=${clientId}`;
//   // This will signal to network manager we are trying to make websocket connection
//   // This is needed later to map clientId to frameId
//   fetch(`http://${url}`).catch(() => {});

//   let callback: WebsocketCallback;
//   try {
//     const socket = new WebSocket(`ws://${url}`);
//     let isReady = false;
//     const queuedCallbacks: { name: string; payload: string }[] = [];

//     const sendOverSocket = (name: string, payload: string): void => {
//       try {
//         console.debug(JSON.stringify({ name, payload }));
//         socket.send(JSON.stringify({ name, payload }));
//       } catch (error) {
//         // eslint-disable-next-line no-console
//         console.log(`failed to send over websocket: ${error}`);
//       }
//     };

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     callback = (name, payload): void => {
//       if (!isReady) {
//         queuedCallbacks.push({ name, payload });
//         return;
//       }
//       sendOverSocket(name, payload);
//     };

//     socket.addEventListener('open', _event => {
//       let queuedCallback = queuedCallbacks.shift();
//       while (queuedCallback) {
//         sendOverSocket(queuedCallback.name, queuedCallback.payload);
//         queuedCallback = queuedCallbacks.shift();
//       }
//       // Only ready when all older messages have been send so we
//       // keep original order of messages.
//       isReady = true;
//     });
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.log(`failed to use websocket: ${error}`);
//   }

//   // eslint-disable-next-line @typescript-eslint/no-unused-expressions
//   SCRIPT_PLACEHOLDER;
// }
