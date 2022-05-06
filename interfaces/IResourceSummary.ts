import IResourceType from '@bureau/interfaces/IResourceType';

export default interface IResourceSummary {
  url: string;
  method: string;
  id: number;
  tabId: number;
  frameId: number;
  statusCode: number;
  type: IResourceType;
  redirectedToUrl?: string;
  timestamp?: number;
  hasResponse: boolean;
  contentType: string;
}
