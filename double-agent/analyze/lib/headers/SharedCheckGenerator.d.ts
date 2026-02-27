import IHeaderDataPage from '@double-agent/collect/interfaces/IHeaderDataPage';
import BaseCheck from '../checks/BaseCheck';
export default class SharedCheckGenerator {
    readonly userAgentId: string;
    readonly data: IHeaderDataPage[];
    constructor(userAgentId: string, data: IHeaderDataPage[]);
    createDefaultValueChecks(): BaseCheck[];
    createHeaderCaseChecks(...includeHeaders: string[]): BaseCheck[];
    createHeaderOrderChecks(...excludeHeaders: string[]): BaseCheck[];
}
export declare function extractOrderIndexMapFromArrays(arrays: string[][]): {
    [key: string]: [string[], string[]];
};
