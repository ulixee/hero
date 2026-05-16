export default class CoreKeepAlivePrompt {
    private onQuit;
    readonly message: string;
    private cliPrompt;
    constructor(message: string, onQuit: () => Promise<any>);
    close(): void;
}
