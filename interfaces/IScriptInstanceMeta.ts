export default interface IScriptInstanceMeta {
  id: string;
  entrypoint: string;
  startDate: number;
  workingDirectory: string;
  execPath?: string;
  execArgv?: string[];
}
