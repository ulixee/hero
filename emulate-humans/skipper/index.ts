import { IInteractionGroups, IInteractionStep } from "@secret-agent/interfaces/IInteractions";
import { HumanEmulatorClassDecorator } from '@secret-agent/interfaces/IHumanEmulatorClass';
import IHumanEmulator from "@secret-agent/interfaces/IHumanEmulator";
import * as pkg from './package.json';

@HumanEmulatorClassDecorator
export default class HumanEmulatorSkipper implements IHumanEmulator {
  public static id = pkg.name;

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
