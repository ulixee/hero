import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
type IData = {
    codeString: string;
} | {
    codeStringToString: string;
};
export default class SetterCheck extends BaseCheck {
    readonly prefix = "SETR";
    readonly type = CheckType.Individual;
    private readonly data;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, data: IData);
    get signature(): string;
    get args(): any[];
}
export {};
