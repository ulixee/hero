import UserAgent from '@ulixee/real-user-agents/lib/UserAgent';
export default class UserAgentSelector {
    readonly userAgentSelector: string;
    private readonly selectors;
    constructor(userAgentSelector: string);
    isMatch(userAgent: UserAgent): boolean;
    private extractUserAgentSelectors;
    private convertToSemVer;
    private cleanupName;
    private cleanupOperator;
    private cleanupVersion;
}
