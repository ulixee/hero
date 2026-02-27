export default interface IPlugin {
    id: string;
    dir: string;
    summary: string;
    outputFiles: number;
    changePluginOrder?(plugins: IPlugin[]): void;
    initialize(): void;
}
