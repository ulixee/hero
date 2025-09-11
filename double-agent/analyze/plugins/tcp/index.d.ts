import Plugin from '@double-agent/analyze/lib/Plugin';
import ITcpProfile from '@double-agent/collect/plugins/tcp/interfaces/IProfile';
export default class TcpPlugin extends Plugin {
    initialize(profiles: ITcpProfile[]): void;
    runIndividual(profile: any): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
