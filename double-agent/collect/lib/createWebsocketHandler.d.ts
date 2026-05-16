import * as http from 'http';
import * as net from 'net';
import IServerContext from '../interfaces/IServerContext';
import BaseServer from '../servers/BaseServer';
export default function createWebsocketHandler(server: BaseServer, detectionContext: IServerContext): (req: http.IncomingMessage, socket: net.Socket, head: any) => Promise<void>;
