import IResourceHeaders from './IResourceHeaders';

export default interface IResourceRequest {
  url: string;
  timestamp: number;
  headers: IResourceHeaders;
  trailers?: IResourceHeaders;
  method: string;
  postData: any;
}
