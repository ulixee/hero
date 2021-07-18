import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IHero from '@ulixee/hero-interfaces/IHero';
import ConnectionToCore from '../connections/ConnectionToCore';
import IConnectionToCoreOptions from './IConnectionToCoreOptions';

export default interface IHeroCreateOptions
  extends Partial<
    Omit<ISessionCreateOptions, 'scriptInstanceMeta' | 'sessionName' | 'dependencyMap'>
  >, IDataboxMinimal {
  name?: string;
  showReplay?: boolean;
  connectionToCore?: IConnectionToCoreOptions | ConnectionToCore;
  databox?: IDataboxMinimal;
}

interface IDataboxMinimal {
  externalController?: IHero;
}
