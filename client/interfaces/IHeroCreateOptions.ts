import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ConnectionToCore from '../connections/ConnectionToCore';
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
  connectionToCore?: IConnectionToCoreOptions | ConnectionToCore;
}
