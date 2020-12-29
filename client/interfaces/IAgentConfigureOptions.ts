import IAgentCreateOptions from './IAgentCreateOptions';

export default interface IAgentConfigureOptions extends Omit<IAgentCreateOptions, 'name'> {}
