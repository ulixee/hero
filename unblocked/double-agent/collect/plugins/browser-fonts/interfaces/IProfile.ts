import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';

type IProfile = IBaseProfile<IProfileData>;

export default IProfile;

export interface IProfileData {
  fonts: string[];
}
