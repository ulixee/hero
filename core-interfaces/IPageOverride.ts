export default interface IPageOverride {
  script: string;
  callback?: (json: any) => void;
  callbackWindowName?: string;
}
