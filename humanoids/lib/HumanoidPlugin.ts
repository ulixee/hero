import { IInteractionGroups, IInteractionStep } from '@secret-agent/core-interfaces/IInteractions';

export default abstract class HumanoidPlugin {
  public static id: string;

  public abstract async playInteractions(
    interactions: IInteractionGroups,
    run: (interaction: IInteractionStep) => Promise<void>,
  );
}
