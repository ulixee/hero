import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
export default function setActiveAndFocused(emulationProfile: IEmulationProfile, pageOrFrame: IPage | IFrame): Promise<any>;
