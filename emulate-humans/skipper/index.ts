import { IInteractionGroups, IInteractionStep } from "@secret-agent/core-interfaces/IInteractions";
import { HumanEmulatorClassDecorator } from '@secret-agent/core-interfaces/IHumanEmulatorClass';
import IHumanEmulator from "@secret-agent/core-interfaces/IHumanEmulator";

@HumanEmulatorClassDecorator
export default class HumanEmulatorSkipper implements IHumanEmulator {
  public static id = 'skipper';

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
