import IDevtoolsSession from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
export default function setScreensize(emulationProfile: IEmulationProfile, page: IPage, devtools: IDevtoolsSession): Promise<void>;
