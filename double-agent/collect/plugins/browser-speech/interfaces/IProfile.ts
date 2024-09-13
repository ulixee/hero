import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';

type IProfile = IBaseProfile<IProfileData>;

export default IProfile;

export type IProfileData = {
  http?: { voices: IVoice[] };
  https?: { voices: IVoice[] };
};

export interface IVoice {
  default: boolean;
  lang: string;
  localService: boolean;
  name: string;
  voiceURI: string;
}
