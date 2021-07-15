import { IBlockedResourceType } from '@secret-agent/interfaces/ITabOptions';
import IUserProfile from '@secret-agent/interfaces/IUserProfile';

export default interface IAgentDefaults {
  defaultBlockedResourceTypes?: IBlockedResourceType[];
  defaultUserProfile?: IUserProfile;
}
