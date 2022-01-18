import IResourceHeaders from './IResourceHeaders';
import IHttpResourceLoadDetails from './IHttpResourceLoadDetails';

export default interface IResourceResponse {
  url: string;
  timestamp: number;
  headers: IResourceHeaders;
  trailers?: IResourceHeaders;
  browserServedFromCache?: IHttpResourceLoadDetails['browserServedFromCache'];
  browserLoadFailure?: string;
  browserLoadedTime?: number;
  remoteAddress: string;
  statusCode: number;
  statusMessage?: string;
  body?: Buffer;
}
