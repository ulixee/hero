import * as http from 'http';
import IncomingMessage from '@double-agent/tls-server/lib/IncomingMessage';
import IRequestContext from './IRequestContext';
export default interface IRequestTlsContext extends IRequestContext {
    req: IncomingMessage & http.IncomingMessage;
}
