import IResourceType from '@bureau/interfaces/IResourceType';
import Resource from '../lib/Resource';

export default interface IWaitForResourceFilter {
  url?: string | RegExp;
  type?: IResourceType;
  filterFn?: (resource: Resource) => Promise<boolean> | boolean;
}
