import Agent from '../lib/Agent';
import CoreFrameEnvironment from '../lib/CoreFrameEnvironment';

export default interface IAwaitedOptions {
  secretAgent: Agent;
  coreFrame: Promise<CoreFrameEnvironment>;
}
