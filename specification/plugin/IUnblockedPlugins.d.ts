import IUnblockedPlugin from './IUnblockedPlugin';
export default interface IUnblockedPlugins extends Required<IUnblockedPlugin> {
    hook(plugin: IUnblockedPlugin): void;
}
