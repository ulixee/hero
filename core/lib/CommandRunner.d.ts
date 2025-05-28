export default class CommandRunner {
    runFn: () => Promise<any>;
    shouldRecord: boolean;
    constructor(command: string, args: any[], targets: {
        [targetName: string]: ICommandableTarget;
    });
}
export interface ICommandableTarget {
    isAllowedCommand(method: string): boolean;
    shouldWaitForCommandLock?(commandName: string): boolean;
}
