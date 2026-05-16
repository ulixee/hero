import ResourceType from './ResourceType';
import HostDomain from './HostDomain';
import OriginType from './OriginType';
export default interface IAsset {
    secureDomain: boolean;
    resourceType: ResourceType;
    domainType?: HostDomain;
    originType?: OriginType;
    pathname?: string;
    referer?: string;
}
