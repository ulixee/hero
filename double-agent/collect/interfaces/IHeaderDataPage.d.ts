import { IServerProtocol } from '../servers/BaseServer';
import { DomainType } from '../lib/DomainUtils';
import OriginType from './OriginType';
import ResourceType from './ResourceType';
export default interface IHeaderDataPage {
    pageName: string;
    method: string;
    isRedirect: boolean;
    protocol: IServerProtocol;
    domainType: DomainType;
    originType: OriginType;
    resourceType: ResourceType;
    pathname: string;
    referer: string;
    rawHeaders: string[][];
}
