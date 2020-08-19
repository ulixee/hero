import IResourceHeaders from './IResourceHeaders';

export default interface IResourceRequest {
  url: string;
  timestamp: string;
  headers: IResourceHeaders;
  trailers?: IResourceHeaders;
  method: string;
  postData: any;
}
