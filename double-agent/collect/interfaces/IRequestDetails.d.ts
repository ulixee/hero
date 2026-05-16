import ResourceType from './ResourceType';
import OriginType from './OriginType';
import { DomainType } from '../lib/DomainUtils';
export default interface IRequestDetails {
    url: string;
    method: string;
    time: Date;
    remoteAddress: string;
    userAgentString: string;
    headers: string[];
    origin: string;
    secureDomain: boolean;
    originType: OriginType;
    resourceType: ResourceType;
    domainType: DomainType;
    bodyJson?: object;
    referer?: string;
    cookies?: {
        [key: string]: string;
    };
}
