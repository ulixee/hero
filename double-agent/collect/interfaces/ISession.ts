import IRequestDetails from './IRequestDetails';
import IUserIdentifiers from './IUserIdentifier';
import IAsset from './IAsset';

export default interface ISession {
  requests: IRequestDetails[];
  identifiers: IUserIdentifiers[];
  assetsNotLoaded: IAsset[];
  expectedAssets: (IAsset & { fromUrl?: string })[];
  pluginsRun: Set<string>;
  userAgentString: string;
  expectedUserAgentString: string;
  id: string;
}
