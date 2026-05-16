import Plugin from '@double-agent/analyze/lib/Plugin';
import IProfile from '@double-agent/collect-http-websockets/interfaces/IProfile';
export default class HttpWebsocketHeaders extends Plugin {
    initialize(profiles: IProfile[]): void;
    runIndividual(profile: any): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
