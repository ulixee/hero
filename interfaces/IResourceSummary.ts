import ResourceType from './ResourceType';

export default interface IResourceSummary {
  url: string;
  method: string;
  id: number;
  tabId: number;
  frameId: number;
  statusCode: number;
  type: ResourceType;
  redirectedToUrl?: string;
  timestamp?: number;
  hasResponse: boolean;
}
