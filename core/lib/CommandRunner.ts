import SessionClosedOrMissingError from '@ulixee/commons/lib/SessionClosedOrMissingError';

export default class CommandRunner {
  public runFn: () => Promise<any>;
  public shouldRecord = true;

  constructor(command: string, args: any[], targets: { [targetName: string]: ICommandableTarget }) {
    const [targetName, method] = command.split('.');

    if (!targets[targetName]) {
      if (method === 'close' || (targetName === 'Events' && args[1] === 'removeEventListener')) {
        this.runFn = () => Promise.resolve({});
        return;
      }

      throw new Error(`Target for command not available (${targetName})`);
    }

    if (!targets[targetName].isAllowedCommand(method)) {
      throw new Error(`Command not allowed (${command}) on ${targetName}`);
    }

    const target = targets[targetName];
    if (!target) {
      throw new SessionClosedOrMissingError(
        `The requested command (${command}) references a ${
          targetName[0].toLowerCase() + targetName.slice(1)
        } that is closed or invalid.`,
      );
    }

    this.runFn = async () => {
      if (!this.shouldRecord) {
        return await target[`___${method}`](...args);
      }
      return await target[method](...args);
    };
  }
}

export interface ICommandableTarget {
  isAllowedCommand(method: string): boolean;
  shouldWaitForCommandLock?(commandName: string): boolean;
}
