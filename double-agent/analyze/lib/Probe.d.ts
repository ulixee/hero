import BaseCheck, { ICheckMeta, ICheckType } from './checks/BaseCheck';
export default class Probe {
    id: string;
    checkName: string;
    checkType: ICheckType;
    checkMeta: ICheckMeta;
    args: any[];
    private readonly pluginId;
    private _check;
    constructor(id: string, checkName: string, checkType: ICheckType, checkMeta: ICheckMeta, args: any[], pluginId: string);
    get check(): BaseCheck;
    toJSON(): Pick<Probe, 'id' | 'checkName' | 'checkMeta' | 'checkType' | 'args'>;
    static create(check: BaseCheck, pluginId: string): Probe;
    static load(probeObj: any, pluginId: string): Probe;
}
