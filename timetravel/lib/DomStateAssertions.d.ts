import { IAssertionAndResult, IAssertionCounts } from '@ulixee/hero-interfaces/IDomStateAssertionBatch';
export default class DomStateAssertions {
    private assertsBySessionId;
    iterateSessionAssertionsByFrameId(sessionId: string): [frameId: string, assertion: IAssertionAndResultByQuery][];
    sessionAssertionsCount(sessionId: string): IAssertionCounts;
    getSessionAssertionWithQuery(sessionId: string, frameId: number, query: string): IAssertionAndResult;
    clearSessionAssertions(sessionId: string): void;
    recordAssertion(sessionId: string, frameId: number, assert: Omit<IAssertionAndResult, 'key'>): void;
    getCommonSessionAssertions(sessionIds: string[], startingAssertions: IFrameAssertions): IFrameAssertions;
    static countAssertions(asserts: IFrameAssertions): IAssertionCounts;
    static generateKey(type: IAssertionAndResult['type'], args: any[]): string;
    static removeAssertsSharedBetweenStates(states: IFrameAssertions[]): void;
}
export interface IFrameAssertions {
    [frameId: string]: IAssertionAndResultByQuery;
}
interface IAssertionAndResultByQuery {
    [query: string]: IAssertionAndResult;
}
export {};
