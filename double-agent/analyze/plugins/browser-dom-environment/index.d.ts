import Plugin from '@double-agent/analyze/lib/Plugin';
import IProfile from '@double-agent/collect-browser-dom-environment/interfaces/IProfile';
export default class BrowserDom extends Plugin {
    initialize(profiles: IProfile[]): void;
    runIndividual(profile: any): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
