import IResourceType from '@bureau/interfaces/IResourceType';

export default interface IResourceFilterProperties {
  url?: string | RegExp;
  type?: IResourceType;
  httpRequest?: {
    method?: string;
    statusCode?: number;
  };
}
