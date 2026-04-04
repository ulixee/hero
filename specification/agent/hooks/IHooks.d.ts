import IInteractHooks from './IInteractHooks';
import IBrowserHooks, { IBrowserContextHooks } from './IBrowserHooks';
import INetworkHooks from './INetworkHooks';
export type IHooksProvider = IInteractHooks & IBrowserHooks & IBrowserContextHooks & INetworkHooks;
export { IBrowserHooks, IBrowserContextHooks, INetworkHooks, IInteractHooks };
