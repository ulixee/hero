import IResourceType from '@unblocked-web/specifications/agent/net/IResourceType';

export default interface IResourceFilterProperties {
  url?: string | RegExp;
  type?: IResourceType;
  httpRequest?: {
    method?: string;
    statusCode?: number;
  };
}
