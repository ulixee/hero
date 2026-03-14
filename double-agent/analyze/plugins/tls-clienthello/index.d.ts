import Plugin from '@double-agent/analyze/lib/Plugin';
import ITlsClienthelloProfile from '@double-agent/collect-tls-clienthello/interfaces/IProfile';
export default class TlsClienthello extends Plugin {
    initialize(profiles: ITlsClienthelloProfile[]): void;
    runIndividual(profile: any): import("@double-agent/analyze/lib/Plugin").IResultFlag[];
}
