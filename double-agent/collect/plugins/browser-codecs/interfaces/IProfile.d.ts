import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
import IWebRTCCodec from './IWebRTCCodec';
import ICodecSupport from './ICodecSupport';
type IProfile = IBaseProfile<IProfileData>;
export default IProfile;
export interface IProfileData {
    audioSupport: ICodecSupport;
    videoSupport: ICodecSupport;
    webRtcVideoCodecs: IWebRTCCodec[];
    webRtcAudioCodecs: IWebRTCCodec[];
}
