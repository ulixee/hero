import IClientPlugin from '@ulixee/hero-interfaces/IClientPlugin';
export default class ClientPlugin implements IClientPlugin {
    static readonly id: string;
    static readonly type: "ClientPlugin";
    readonly id: string;
    constructor();
}
