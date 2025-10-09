import IPoint from '../browser/IPoint';
import { IInteractionGroups, IInteractionStep } from '../interact/IInteractions';
import IInteractionsHelper from '../interact/IInteractionsHelper';
export default interface IInteractHooks {
    playInteractions?(interactions: IInteractionGroups, runFn: (interaction: IInteractionStep) => Promise<void>, helper?: IInteractionsHelper): Promise<void>;
    adjustStartingMousePoint?(point: IPoint, helper?: IInteractionsHelper): Promise<void> | void;
}
