export interface IExecuteJsArgs {
    fnName: string;
    fnSerialized: string;
    args: any[];
    isolateFromWebPageEnvironment: boolean;
}
