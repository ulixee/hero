import Plugin from '@double-agent/analyze/lib/Plugin';
import ICodecProfile from '@double-agent/collect-browser-codecs/interfaces/IProfile';
export default class BrowserCodecs extends Plugin {
    initialize(profiledProfiles: ICodecProfile[]): void;
    runIndividual(profile: any): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
