import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from './BaseCheck';
type IOrderIndex = [prevOrder: string[], postOrder: string[]];
export default class ArrayOrderIndexCheck extends BaseCheck {
    readonly prefix = "AORD";
    readonly type = CheckType.Individual;
    private readonly orderIndex;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, orderIndex: IOrderIndex);
    get signature(): string;
    get args(): any[];
}
export {};
