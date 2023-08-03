import { IBlockedResourceType, InterceptedResource } from '@ulixee/hero-interfaces/ITabOptions';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';

export default interface IHeroDefaults {
  blockedResourceTypes?: IBlockedResourceType[];
  blockedResourceUrls?: (string | RegExp)[];
  interceptedResources?: InterceptedResource[];
  userProfile?: IUserProfile;
  shutdownOnProcessSignals?: boolean;
}
