import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
type IData = {
    hasFunction: boolean;
} | {
    constructorException: string;
};
export default class ClassCheck extends BaseCheck {
    readonly prefix = "CLSS";
    readonly type = CheckType.Individual;
    private readonly data;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, data: IData);
    get signature(): string;
    get args(): IData[];
}
export {};
