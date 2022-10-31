import IHttpHeaders from './IHttpHeaders';
import IHttpResourceLoadDetails from './IHttpResourceLoadDetails';

export default interface IResourceResponse {
  url: string;
  timestamp: number;
  headers: IHttpHeaders;
  trailers?: IHttpHeaders;
  browserServedFromCache?: IHttpResourceLoadDetails['browserServedFromCache'];
  browserLoadFailure?: string;
  browserLoadedTime?: number;
  remoteAddress: string;
  statusCode: number;
  statusMessage?: string;
  buffer?: Buffer;
}
