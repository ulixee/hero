import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import CoreClientConnection from '../connections/CoreClientConnection';
import ICoreConnectionOptions from './ICoreConnectionOptions';

export default interface IAgentCreateOptions
  extends Partial<Omit<ICreateSessionOptions, 'scriptInstanceMeta' | 'sessionName'>> {
  name?: string;
  showReplay?: boolean;
  coreConnection?: ICoreConnectionOptions | CoreClientConnection;
}
