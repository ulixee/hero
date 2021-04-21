import ResourceType from '@secret-agent/interfaces/ResourceType';

export default interface IResourceFilterProperties {
  url?: string | RegExp;
  type?: ResourceType;
}
