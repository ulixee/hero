import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
import ICookieGetDetails from '../../interfaces/ICookieGetDetails';
import ICookieSetDetails from '../../interfaces/ICookieSetDetails';
export default class UnreadableCookieCheck extends BaseCheck {
    readonly prefix = "UCOO";
    readonly type = CheckType.Individual;
    private readonly setDetails;
    private readonly getDetails;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, setDetails: ICookieSetDetails, getDetails: ICookieGetDetails);
    get signature(): string;
    get args(): (ICookieSetDetails | ICookieGetDetails)[];
}
