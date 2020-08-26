import ResourceType from '@secret-agent/core-interfaces/ResourceType';

export default interface IResourceFilterProperties {
  url?: string | RegExp;
  type?: ResourceType;
}
