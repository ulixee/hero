import CoreSession from '../lib/CoreTab';
import Agent from '../lib/Agent';

export default interface IAwaitedOptions {
  secretAgent: Agent;
  coreTab: Promise<CoreSession>;
}
