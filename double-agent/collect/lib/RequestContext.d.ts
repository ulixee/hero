import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import * as http2 from 'http2';
import IRequestContext from '../interfaces/IRequestContext';
import IRequestDetails from '../interfaces/IRequestDetails';
import Session from './Session';
import { DomainType } from './DomainUtils';
import BaseServer, { IServerProtocol } from '../servers/BaseServer';
import { IPluginPage } from './Plugin';
export default class RequestContext implements IRequestContext {
    readonly server: BaseServer;
    readonly req: IncomingMessage | http2.Http2ServerRequest;
    readonly res: ServerResponse | http2.Http2ServerResponse;
    readonly url: URL;
    readonly requestDetails: IRequestDetails;
    readonly session: Session;
    private readonly plugin;
    private readonly currentPageIndex;
    private readonly nextPageIndex;
    constructor(server: BaseServer, req: IncomingMessage | http2.Http2ServerRequest, res: ServerResponse | http2.Http2ServerResponse, url: URL, requestDetails: IRequestDetails, session: Session);
    get page(): IPluginPage;
    get nextPageLink(): string;
    buildUrl(path: string, domainType?: DomainType, protocol?: IServerProtocol): string;
}
