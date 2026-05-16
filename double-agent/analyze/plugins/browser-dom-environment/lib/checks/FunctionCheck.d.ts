import BaseCheck, { CheckType, ICheckIdentity, ICheckMeta } from '@double-agent/analyze/lib/checks/BaseCheck';
export default class FunctionCheck extends BaseCheck {
    readonly prefix = "FUNC";
    readonly type = CheckType.Individual;
    private readonly codeString;
    private readonly methods;
    private readonly invocation;
    constructor(identity: ICheckIdentity, meta: ICheckMeta, codeString: string, methods: {
        [name: string]: string;
    }, invocation: string);
    get signature(): string;
    get args(): (string | {
        [name: string]: string;
    })[];
}
