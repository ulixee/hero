export default abstract class BaseCheck {
    name: string;
    identity: ICheckIdentity;
    meta: ICheckMeta;
    abstract prefix: string;
    abstract type: ICheckType;
    protected constructor(identity: ICheckIdentity, meta: ICheckMeta);
    abstract get signature(): string;
    abstract get args(): any[];
    get id(): string;
    generateHumanScore(check: BaseCheck | null, profileCount?: number): number;
    protected ensureComparableCheck(check: BaseCheck | null): void;
}
export declare enum CheckType {
    Individual = "Individual",
    OverTime = "OverTime"
}
export type ICheckType = keyof typeof CheckType;
export interface ICheckIdentity {
    isUniversal?: boolean;
    userAgentId?: string;
}
export interface ICheckMeta {
    path: string;
    protocol?: string;
    httpMethod?: string;
}
