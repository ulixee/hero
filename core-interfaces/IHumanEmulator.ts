import { IInteractionGroups, IInteractionStep } from './IInteractions';

export default interface IHumanEmulator {
  playInteractions(
    interactions: IInteractionGroups,
    run: (interaction: IInteractionStep) => Promise<void>,
  );
}
