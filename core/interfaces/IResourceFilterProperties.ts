import ResourceType from '@ulixee/hero-interfaces/ResourceType';

export default interface IResourceFilterProperties {
  url?: string | RegExp;
  type?: ResourceType;
}
