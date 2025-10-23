import IDevtoolsSession from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import IUserAgentData from '../../interfaces/IUserAgentData';
export default function setUserAgent(emulationProfile: IEmulationProfile, devtools: IDevtoolsSession, userAgentData: IUserAgentData): Promise<void>;
