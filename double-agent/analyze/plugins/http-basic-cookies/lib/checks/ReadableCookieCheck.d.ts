import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
import ICookieSetDetails from '../../interfaces/ICookieSetDetails';
import ICookieGetDetails from '../../interfaces/ICookieGetDetails';
export default class ReadableCookieCheck extends BaseCheck {
    readonly prefix = "RCOO";
    readonly type = CheckType.Individual;
    private readonly setDetails;
    private readonly getDetails;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, setDetails: ICookieSetDetails, getDetails: ICookieGetDetails);
    get signature(): string;
    get args(): (ICookieSetDetails | ICookieGetDetails)[];
}
