export default interface IFrameMeta {
  id: string;
  tabId: number;
  parentFrameId: string | null;
  securityOrigin: string;
  url: string;
  name: string;
}
