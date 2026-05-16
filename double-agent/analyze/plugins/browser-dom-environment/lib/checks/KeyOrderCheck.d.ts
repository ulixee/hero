import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class KeyOrderCheck extends BaseCheck {
    readonly prefix = "KORD";
    readonly type = CheckType.Individual;
    private readonly keys;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, keys: string[]);
    get signature(): string;
    get args(): string[][];
}
