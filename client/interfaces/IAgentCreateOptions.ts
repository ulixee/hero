import ISessionCreateOptions from '@secret-agent/interfaces/ISessionCreateOptions';
import ConnectionToCore from '../connections/ConnectionToCore';
import IConnectionToCoreOptions from './IConnectionToCoreOptions';

export default interface IAgentCreateOptions
  extends Partial<Omit<ISessionCreateOptions, 'scriptInstanceMeta' | 'sessionName' | 'dependencyMap'>> {
  name?: string;
  showReplay?: boolean;
  connectionToCore?: IConnectionToCoreOptions | ConnectionToCore;
  input?: { command?: string } & any;
}
