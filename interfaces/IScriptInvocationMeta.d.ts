export default interface IScriptInvocationMeta {
    entrypoint: string;
    entryFunction?: string;
    productId: string;
    version: string;
    runtime?: string;
    runId?: string;
    workingDirectory?: string;
    execPath?: string;
    execArgv?: string[];
}
