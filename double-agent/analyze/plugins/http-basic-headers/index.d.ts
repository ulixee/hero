import Plugin from '@double-agent/analyze/lib/Plugin';
import IHttpBasicHeadersProfile from '@double-agent/collect-http-basic-headers/interfaces/IProfile';
export default class HttpBasicHeaders extends Plugin {
    initialize(profiles: IHttpBasicHeadersProfile[]): void;
    runIndividual(profile: any): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
