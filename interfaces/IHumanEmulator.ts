import { IInteractionGroups, IInteractionStep } from './IInteractions';
import IInteractionsHelper from './IInteractionsHelper';
import IPoint from './IPoint';

export default interface IHumanEmulator {
  playInteractions(
    interactions: IInteractionGroups,
    run: (interaction: IInteractionStep) => Promise<void>,
    helper?: IInteractionsHelper,
  );
  getStartingMousePoint?(helper?: IInteractionsHelper): Promise<IPoint>;
}
