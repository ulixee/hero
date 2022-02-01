import IResourceType from './IResourceType';

export default interface IResourceFilterProperties {
  url?: string | RegExp;
  type?: IResourceType;
  httpRequest?: {
    method?: string;
    statusCode?: number;
  };
}
