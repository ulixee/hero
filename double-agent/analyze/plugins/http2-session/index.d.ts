import Plugin from '@double-agent/analyze/lib/Plugin';
import IHttp2SessionProfile from '@double-agent/collect-http2-session/interfaces/IProfile';
export default class Http2SessionHeaders extends Plugin {
    initialize(profiles: IHttp2SessionProfile[]): void;
    runIndividual(profile: any): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
