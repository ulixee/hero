import IResourceHeaders from './IResourceHeaders';

export default interface IResourceResponse {
  url: string;
  timestamp: string;
  headers: IResourceHeaders;
  trailers?: IResourceHeaders;
  remoteAddress: string;
  statusCode: number;
  statusMessage?: string;
}
