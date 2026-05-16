import IHttpResourceLoadDetails from '@ulixee/unblocked-specification/agent/net/IHttpResourceLoadDetails';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import IBrowserData from '../../interfaces/IBrowserData';
import IUserAgentData from '../../interfaces/IUserAgentData';
export default function modifyHeaders(emulationProfile: IEmulationProfile, data: IBrowserData, userAgentData: IUserAgentData, resource: IHttpResourceLoadDetails): boolean;
