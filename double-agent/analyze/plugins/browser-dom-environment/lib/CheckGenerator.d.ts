import BaseCheck from '@double-agent/analyze/lib/checks/BaseCheck';
import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
export default class CheckGenerator {
    checks: BaseCheck[];
    private readonly endpointsByPath;
    private readonly userAgentId;
    constructor(profile: IBaseProfile<any>);
    private addKeyOrderChecks;
    private addFlagChecks;
    private addPrototypeChecks;
    private addNumberChecks;
    private addFunctionChecks;
    private addStringChecks;
    private addGetterChecks;
    private addSetterChecks;
    private addRefChecks;
    private addClassChecks;
    private addBooleanChecks;
    private addArrayChecks;
    private addSymbolChecks;
    private addTypeChecks;
    private didAddAutomationChecks;
    private add;
}
