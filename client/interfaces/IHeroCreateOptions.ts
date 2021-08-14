import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import ConnectionToCore from '../connections/ConnectionToCore';
import IConnectionToCoreOptions from './IConnectionToCoreOptions';

export default interface IHeroCreateOptions
  extends Partial<
    Omit<ISessionCreateOptions, 'scriptInstanceMeta' | 'sessionName' | 'dependencyMap'>
  > {
  name?: string;
  databox?: any; // this is only here to stop typescript from throwing error
  connectionToCore?: IConnectionToCoreOptions | ConnectionToCore;
}
