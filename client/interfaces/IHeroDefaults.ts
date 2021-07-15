import { IBlockedResourceType } from '@ulixee/hero-interfaces/ITabOptions';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';

export default interface IHeroDefaults {
  defaultBlockedResourceTypes?: IBlockedResourceType[];
  defaultUserProfile?: IUserProfile;
}
