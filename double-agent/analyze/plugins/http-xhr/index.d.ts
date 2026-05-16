import Plugin from '@double-agent/analyze/lib/Plugin';
import IHttpXhrHeadersProfile from '@double-agent/collect-http-basic-headers/interfaces/IProfile';
export default class HttpXhrHeaders extends Plugin {
    initialize(profiles: IHttpXhrHeadersProfile[]): void;
    runIndividual(profile: any): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
