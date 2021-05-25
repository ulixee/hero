import CoreFrameEnvironment from '../lib/CoreFrameEnvironment';

export default interface IAwaitedOptions {
  coreFrame: Promise<CoreFrameEnvironment>;
}
