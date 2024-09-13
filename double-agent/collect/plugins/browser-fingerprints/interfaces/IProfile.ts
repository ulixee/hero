import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';

type IProfile = IBaseProfile<IProfileData>;

export default IProfile;

export type IProfileData = IProfileDataFingerprint[];

export interface IProfileDataFingerprint {
  sessionHash: string;
  browserHash: string;
  components: { key: string; value: object }[];
  userAgentString: string;
}
