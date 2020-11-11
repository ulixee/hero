export default interface INewDocumentInjectedScript {
  script: string;
  callback?: (json: any) => void;
  callbackWindowName?: string;
}
