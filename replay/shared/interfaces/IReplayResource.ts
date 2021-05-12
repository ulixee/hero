export interface IReplayResource {
  url: string;
  id: number;
  tabId: number;
  statusCode: number;
  type: string;
  redirectedToUrl?: string;
}
