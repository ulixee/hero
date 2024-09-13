import IClientHello from '@double-agent/tls-server/interfaces/IClientHello';
import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';

type IProfile = IBaseProfile<IProfileData>;

export default IProfile;

export interface IProfileData {
  clientHello: IClientHello;
}
