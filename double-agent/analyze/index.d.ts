import '@ulixee/commons/lib/SourceMapSupport';
import { UserAgentToTestPickType, IUserAgentToTestPickType } from '@double-agent/config/interfaces/IUserAgentToTest';
import Plugin, { IResultFlag } from './lib/Plugin';
interface IResult {
    userAgentId: string;
    flags: IResultFlag[];
}
export default class Analyze {
    plugins: Plugin[];
    private readonly probesDataDir;
    private readonly profileCountOverTime;
    private resultsMap;
    constructor(profileCountOverTime: number, probesDataDir: string);
    addIndividual(individualsDir: string, userAgentId: string): IResultFlag[];
    addOverTime(sessionsDir: string, pickType: IUserAgentToTestPickType): IResult[];
    generateTestResults(): IAnalyzeScore;
}
export interface IAnalyzeScore {
    total: {
        [UserAgentToTestPickType.popular]: number;
        [UserAgentToTestPickType.random]: number;
    };
    individualByUserAgentId: {
        [userAgentId: string]: number;
    };
    sessionsByPickType: {
        [UserAgentToTestPickType.popular]: ISessionScore[];
        [UserAgentToTestPickType.random]: ISessionScore[];
    };
}
export interface ISessionScore {
    userAgentId: string;
    humanScore: {
        individual: number;
        overTime: number;
        total: number;
    };
}
export {};
