import { IRenderingOption } from '@secret-agent/core-interfaces/ITabOptions';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';

export default interface IAgentDefaults {
  defaultRenderingOptions?: IRenderingOption[];
  defaultUserProfile?: IUserProfile;
}
