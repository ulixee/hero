import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';

export default class AutomationCheck extends BaseCheck {
  public readonly prefix = 'AUTO';
  public readonly type = CheckType.Individual;

  public constructor(identity: ICheckIdentity, meta: ICheckMeta) {
    super(identity, meta);
  }

  public get signature() {
    return this.id;
  }

  public get args() {
    return [];
  }

  public override generateHumanScore(check: AutomationCheck | null): number {
    super.generateHumanScore(check);
    return check ? 0 : 100;
  }
}
