import IResourceType from '@ulixee/unblocked-specification/agent/net/IResourceType';

export default interface IResourceFilterProperties {
  url?: string | RegExp;
  type?: IResourceType;
  httpRequest?: {
    method?: string;
    statusCode?: number;
  };
}
