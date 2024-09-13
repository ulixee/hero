export default abstract class BaseCheck {
  public name: string;
  public identity: ICheckIdentity;
  public meta: ICheckMeta;

  abstract prefix: string;
  abstract type: ICheckType;

  protected constructor(identity: ICheckIdentity, meta: ICheckMeta) {
    this.name = this.constructor.name;
    this.identity = identity;
    this.meta = meta;
  }

  abstract get signature(): string;

  abstract get args(): any[];

  public get id(): string {
    const { protocol, httpMethod, path } = this.meta;
    return [protocol, httpMethod, path, this.constructor.name].filter(x => x).join(':');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public generateHumanScore(check: BaseCheck | null, profileCount?: number): number {
    this.ensureComparableCheck(check);
    return check ? 100 : 0;
  }

  protected ensureComparableCheck(check: BaseCheck | null): void {
    if (check && this.signature !== check.signature) {
      throw new Error(`Check Signatures do not match: ${this.signature} !== ${check.signature}`);
    }
  }
}

export enum CheckType {
  Individual = 'Individual',
  OverTime = 'OverTime',
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
