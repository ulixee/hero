import ServerResponse from '@double-agent/tls-server/lib/ServerResponse';
import IncomingMessage from '@double-agent/tls-server/lib/IncomingMessage';
import IServerContext from '../interfaces/IServerContext';
import BaseServer from '../servers/BaseServer';
export default function createTlsRequestHandler(server: BaseServer, serverContext: IServerContext): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
