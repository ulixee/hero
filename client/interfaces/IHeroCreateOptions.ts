import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ConnectionToCore from '../connections/ConnectionToCore';
import IConnectionToCoreOptions from './IConnectionToCoreOptions';

export default interface IHeroCreateOptions
  extends Partial<
    Omit<
      ISessionCreateOptions,
      'scriptInstanceMeta' | 'sessionName' | 'dependencyMap' | 'externalIds' | 'sessionId'
    >
  > {
  name?: string;
  sessionId?: string | Promise<string>;
  externalIds?: { [id: string]: Promise<number | string> | number | string };
  connectionToCore?: IConnectionToCoreOptions | ConnectionToCore;
}
