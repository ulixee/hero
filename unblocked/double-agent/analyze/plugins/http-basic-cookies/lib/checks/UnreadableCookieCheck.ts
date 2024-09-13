import BaseCheck, {
  CheckType,
  ICheckIdentity,
  ICheckMeta,
} from '@double-agent/analyze/lib/checks/BaseCheck';
import ICookieGetDetails from '../../interfaces/ICookieGetDetails';
import ICookieSetDetails from '../../interfaces/ICookieSetDetails';

export default class UnreadableCookieCheck extends BaseCheck {
  public readonly prefix = 'UCOO';
  public readonly type = CheckType.Individual;

  private readonly setDetails: ICookieSetDetails;
  private readonly getDetails: ICookieGetDetails;

  constructor(
    identity: ICheckIdentity,
    meta: ICheckMeta,
    setDetails: ICookieSetDetails,
    getDetails: ICookieGetDetails,
  ) {
    super(identity, meta);
    this.setDetails = setDetails;
    this.getDetails = getDetails;
  }

  public get signature() {
    const setDetails = Object.keys(this.setDetails)
      .sort()
      .map(k => this.setDetails[k])
      .join(',');
    const getDetails = Object.keys(this.getDetails)
      .sort()
      .map(k => this.getDetails[k])
      .join(',');
    return `${this.id}:${setDetails};${getDetails}`;
  }

  public get args() {
    return [this.setDetails, this.getDetails];
  }
}
