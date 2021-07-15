import { IPuppetLaunchError } from '@ulixee/hero-interfaces/IPuppetLaunchError';

export default class PuppetLaunchError extends Error implements IPuppetLaunchError {
  constructor(message: string, stack: string, readonly isSandboxError: boolean) {
    super(message);
    this.stack = stack;
    this.name = 'PuppetLaunchError';
  }
}
