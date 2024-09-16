import IHttpHeaders from './IHttpHeaders';

export default interface IResourceRequest {
  url: string;
  timestamp: number;
  headers: IHttpHeaders;
  trailers?: IHttpHeaders;
  method: string;
  postData?: Buffer;
}
