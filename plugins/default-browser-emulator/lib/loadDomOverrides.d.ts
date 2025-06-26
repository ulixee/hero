import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import IBrowserData from '../interfaces/IBrowserData';
import IUserAgentData from '../interfaces/IUserAgentData';
import DomOverridesBuilder from './DomOverridesBuilder';
import IBrowserEmulatorConfig from '../interfaces/IBrowserEmulatorConfig';
export default function loadDomOverrides(config: IBrowserEmulatorConfig, emulationProfile: IEmulationProfile, data: IBrowserData, userAgentData: IUserAgentData): DomOverridesBuilder;
