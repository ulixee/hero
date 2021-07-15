import ResourceType from '@ulixee/hero-interfaces/ResourceType';
import Resource from '../lib/Resource';

export default interface IWaitForResourceFilter {
  url?: string | RegExp;
  type?: ResourceType;
  filterFn?: (resource: Resource, done: () => void) => Promise<boolean> | boolean;
}
