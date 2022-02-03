export default interface ICollectedElement {
  id?: number;
  name: string;
  frameId: number;
  frameNavigationId: number;
  tabId: number;
  commandId: number;
  domChangesTimestamp: number;
  nodePointerId: number;
  nodeType: string;
  nodePreview: string;
  outerHTML?: string;
}
