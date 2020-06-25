import IResourceHeaders from './IResourceHeaders';

export default interface IResourceResponse {
  url: string;
  timestamp: string;
  headers: IResourceHeaders;
  remoteAddress: string;
  statusCode: number;
  statusText: string;
}
