import Resource from '@secret-agent/client/lib/Resource';
import ResourceType from './ResourceType';

export default interface IResourceQuery {
  url?: string | RegExp;
  type?: ResourceType;
  filterFn?: (resource: Resource, done: () => void) => boolean;
}
