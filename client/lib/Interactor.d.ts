import IInteractions from '../interfaces/IInteractions';
import CoreFrameEnvironment from './CoreFrameEnvironment';
export default class Interactor {
    static run(coreFrame: CoreFrameEnvironment, interactions: IInteractions): Promise<void>;
}
