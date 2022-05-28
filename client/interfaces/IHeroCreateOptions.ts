import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
import IConnectionToCoreOptions from './IConnectionToCoreOptions';

export default interface IHeroCreateOptions
  extends Partial<
    Omit<
      ISessionCreateOptions,
      'scriptInstanceMeta' | 'sessionName' | 'dependencyMap' | 'sessionId'
    >
  > {
  name?: string;
  sessionId?: string | Promise<string>;
  connectionToCore?: IConnectionToCoreOptions | ConnectionToHeroCore;
}
