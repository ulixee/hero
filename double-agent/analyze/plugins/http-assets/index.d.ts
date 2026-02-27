import Plugin from '@double-agent/analyze/lib/Plugin';
import IProfile from '@double-agent/collect-http-assets/interfaces/IProfile';
export default class HttpAssetHeaders extends Plugin {
    initialize(profiles: IProfile[]): void;
    runIndividual(profile: any): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
