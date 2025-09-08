import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
import IHeaderDataPage from '@double-agent/collect/interfaces/IHeaderDataPage';
type IProfile = IBaseProfile<IProfileData>;
export default IProfile;
export type IProfileData = IHeaderDataPage[];
