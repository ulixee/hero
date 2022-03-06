import IResourceType from '@ulixee/hero-interfaces/IResourceType';
import Resource from '../lib/Resource';

export default interface IWaitForResourceFilter {
  url?: string | RegExp;
  type?: IResourceType;
  filterFn?: (resource: Resource) => Promise<boolean> | boolean;
}
