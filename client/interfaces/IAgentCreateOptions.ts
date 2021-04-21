import ICreateSessionOptions from '@secret-agent/interfaces/ICreateSessionOptions';
import ConnectionToCore from '../connections/ConnectionToCore';
import IConnectionToCoreOptions from './IConnectionToCoreOptions';

export default interface IAgentCreateOptions
  extends Partial<Omit<ICreateSessionOptions, 'scriptInstanceMeta' | 'sessionName'>> {
  name?: string;
  showReplay?: boolean;
  connectionToCore?: IConnectionToCoreOptions | ConnectionToCore;
}
