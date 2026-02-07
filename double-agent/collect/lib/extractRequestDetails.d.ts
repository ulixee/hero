import { URL } from 'url';
import * as http from 'http';
import * as http2 from 'http2';
import ResourceType from '../interfaces/ResourceType';
import IRequestDetails from '../interfaces/IRequestDetails';
import OriginType from '../interfaces/OriginType';
import { DomainType } from './DomainUtils';
import BaseServer from '../servers/BaseServer';
import Session from './Session';
export default function extractRequestDetails(server: BaseServer, req: http.IncomingMessage | http2.Http2ServerRequest, session: Session, overrideResourceType?: ResourceType): Promise<{
    requestDetails: IRequestDetails;
    requestUrl: URL;
}>;
export declare function getResourceType(httpMethod: string, pathname: string): ResourceType;
export declare function getOriginType(referer: URL, hostDomainType: DomainType): OriginType;
