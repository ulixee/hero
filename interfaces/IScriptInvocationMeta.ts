export default interface IScriptInvocationMeta {
  entrypoint: string;
  entryFunction?: string;
  version: string;
  runId?: string;
  runtime?: string;
  workingDirectory?: string;
  execPath?: string;
  execArgv?: string[];
}
