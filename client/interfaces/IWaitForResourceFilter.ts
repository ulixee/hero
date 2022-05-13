import IResourceType from '@unblocked-web/specifications/agent/net/IResourceType';
import Resource from '../lib/Resource';

export default interface IWaitForResourceFilter {
  url?: string | RegExp;
  type?: IResourceType;
  filterFn?: (resource: Resource) => Promise<boolean> | boolean;
}
