import { HumanoidPlugin } from '@secret-agent/humanoids';
import { IInteractionGroups, IInteractionStep } from '@secret-agent/core-interfaces/IInteractions';

export default class HumanoidSkipper implements HumanoidPlugin {
  public async playInteractions(
    interactionGroups: IInteractionGroups,
    run: (interactionStep: IInteractionStep) => Promise<void>,
  ) {
    for (const interactionGroup of interactionGroups) {
      for (const interactionStep of interactionGroup) {
        await run(interactionStep);
      }
    }
  }
}
