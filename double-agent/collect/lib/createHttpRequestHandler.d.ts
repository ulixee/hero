import { IncomingMessage, ServerResponse } from 'http';
import * as http2 from 'http2';
import IServerContext from '../interfaces/IServerContext';
import BaseServer from '../servers/BaseServer';
type IHttpRequestHandler = (req: IncomingMessage | http2.Http2ServerRequest, res: ServerResponse | http2.Http2ServerResponse) => Promise<void>;
export default function createHttpRequestHandler(server: BaseServer, serverContext: IServerContext): IHttpRequestHandler;
export {};
