import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
type IData = {
    codeString: string;
} | {
    codeStringToString: string;
} | {
    accessException: string;
};
export default class GetterCheck extends BaseCheck {
    readonly prefix = "GETR";
    readonly type = CheckType.Individual;
    private readonly data;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, data: IData);
    get signature(): string;
    get args(): any[];
}
export {};
