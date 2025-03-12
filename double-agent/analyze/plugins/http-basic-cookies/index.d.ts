import Plugin from '@double-agent/analyze/lib/Plugin';
import IHttpBasicCookiesProfile from '@double-agent/collect-http-basic-cookies/interfaces/IProfile';
export default class HttpCookies extends Plugin {
    initialize(profiles: IHttpBasicCookiesProfile[]): void;
    runIndividual(profile: any): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
