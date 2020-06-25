import { HumanoidPlugin } from '@secret-agent/humanoids';
import { IInteractionGroups, IInteractionStep } from '@secret-agent/core-interfaces/IInteractions';

export default class HumanoidBasic implements HumanoidPlugin {
  public async playInteractions(
    interactionGroups: IInteractionGroups,
    run: (interactionStep: IInteractionStep) => Promise<void>,
  ) {
    for (let i = 0; i < interactionGroups.length; i += 1) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      for (const interactionStep of interactionGroups[i]) {
        await run(interactionStep);
      }
    }
  }
}
