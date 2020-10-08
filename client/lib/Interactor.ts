import {
  IInteractionGroup,
  IInteractionGroups,
  IInteractionStep,
  IKeyboardCommand,
  IMousePosition as ICoreMousePosition,
  InteractionCommand as CoreCommand,
  MouseButton,
} from '@secret-agent/core-interfaces/IInteractions';
import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement, ISuperNode } from 'awaited-dom/base/interfaces/super';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { IKeyboardKeyCode } from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import IInteractions, {
  Command,
  ICommand,
  IInteraction,
  IMousePosition,
} from '../interfaces/IInteractions';
import CoreTab from './CoreTab';

const { getState } = StateMachine<ISuperElement | ISuperNode, { awaitedPath: AwaitedPath }>();

const COMMAND_POS: { [k: string]: number } = {
  waitForNode: 0,
  waitForElementVisible: 1,
  waitForMillis: 2,
  click: 3,
  doubleclick: 4,
  clickDown: 5,
  scroll: 6,
  move: 7,
  clickUp: 8,
  keyPress: 9,
  keyDown: 10,
  type: 11,
  keyUp: 12,
};
const MAX_COMMAND_POS = Object.keys(COMMAND_POS).length;

export default class Interactor {
  public static async run(coreTab: CoreTab, interactions: IInteractions) {
    const interactionGroups = convertToInteractionGroups(interactions);
    await coreTab.interact(interactionGroups);
  }
}

function convertToInteractionGroups(interactions: IInteractions): IInteractionGroups {
  const lastPosition: IMousePosition = [0, 0];
  const interactionGroups: IInteractionGroups = [];
  interactions.forEach(interaction => {
    if (typeof interaction === 'string') {
      const interactionStep: IInteractionStep = convertCommandToInteractionStep(interaction);
      interactionStep.mousePosition = lastPosition;
      interactionGroups.push([interactionStep]);
    } else {
      const interactionGroup = convertInteractionToInteractionGroup(interaction);
      interactionGroups.push(interactionGroup);
    }
  });
  return interactionGroups;
}

function convertToCoreMousePosition(mousePosition: IMousePosition): ICoreMousePosition {
  if (Array.isArray(mousePosition)) {
    return mousePosition;
  }
  const { awaitedPath } = getState(mousePosition);
  if (!awaitedPath) throw new Error(`Element not found -> ${mousePosition}`);
  return awaitedPath.toJSON();
}

function convertInteractionToInteractionGroup(interaction: IInteraction): IInteractionGroup {
  const iGroup: IInteractionGroup = [];

  Object.entries(interaction).forEach(([key, value]) => {
    switch (key) {
      case Command.scroll: {
        const command = CoreCommand.scroll;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition });
      }
      case Command.move: {
        const command = CoreCommand.move;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition });
      }

      case Command.click: {
        const command = CoreCommand.click;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition });
      }
      case Command.clickLeft: {
        const command = CoreCommand.click;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.left });
      }
      case Command.clickMiddle: {
        const command = CoreCommand.click;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.middle });
      }
      case Command.clickRight: {
        const command = CoreCommand.click;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.right });
      }

      case Command.clickUp: {
        const command = CoreCommand.clickUp;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition });
      }
      case Command.clickUpLeft: {
        const command = CoreCommand.clickUp;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.left });
      }
      case Command.clickUpMiddle: {
        const command = CoreCommand.clickUp;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.middle });
      }
      case Command.clickUpRight: {
        const command = CoreCommand.clickUp;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.right });
      }

      case Command.clickDown: {
        const command = CoreCommand.clickDown;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition });
      }
      case Command.clickDownLeft: {
        const command = CoreCommand.clickDown;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.left });
      }
      case Command.clickDownMiddle: {
        const command = CoreCommand.clickDown;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.middle });
      }
      case Command.clickDownRight: {
        const command = CoreCommand.clickDown;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.right });
      }

      case Command.doubleclick: {
        const command = CoreCommand.doubleclick;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition });
      }
      case Command.doubleclickLeft: {
        const command = CoreCommand.doubleclick;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.left });
      }
      case Command.doubleclickMiddle: {
        const command = CoreCommand.doubleclick;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.middle });
      }
      case Command.doubleclickRight: {
        const command = CoreCommand.doubleclick;
        const mousePosition = convertToCoreMousePosition(value);
        return iGroup.push({ command, mousePosition, mouseButton: MouseButton.right });
      }

      case Command.keyPress: {
        const command = CoreCommand.type;
        return iGroup.push({ command, keyboardCommands: [{ keyCode: value as IKeyboardKeyCode }] });
      }
      case Command.keyDown: {
        const command = CoreCommand.type;
        return iGroup.push({ command, keyboardCommands: [{ down: value as IKeyboardKeyCode }] });
      }
      case Command.keyUp: {
        const command = CoreCommand.type;
        return iGroup.push({ command, keyboardCommands: [{ up: value as IKeyboardKeyCode }] });
      }
      case Command.type: {
        const command = CoreCommand.type;
        const keyboardCommands: IKeyboardCommand[] = [];
        if (typeof value === 'string') {
          keyboardCommands.push({ string: value });
        } else if (typeof value === 'number') {
          keyboardCommands.push({ keyCode: value as IKeyboardKeyCode });
        }
        return iGroup.push({ command, keyboardCommands });
      }

      case Command.waitForNode: {
        const command = CoreCommand.waitForNode;
        const { awaitedPath } = getState(value);
        const jsPath = awaitedPath.toJSON();
        return iGroup.push({ command, delayNode: jsPath });
      }
      case Command.waitForElementVisible: {
        const command = CoreCommand.waitForElementVisible;
        const { awaitedPath } = getState(value);
        const jsPath = awaitedPath.toJSON();
        return iGroup.push({ command, delayElement: jsPath });
      }
      case Command.waitForMillis: {
        const command = CoreCommand.waitForMillis;
        return iGroup.push({ command, delayMillis: value });
      }
    }
  });

  const sortedIGroup = iGroup.sort((a, b) => {
    const aPos: number = COMMAND_POS[a.command] || MAX_COMMAND_POS;
    const bPos: number = COMMAND_POS[b.command] || MAX_COMMAND_POS;
    if (aPos < bPos) {
      return -1;
    }
    if (aPos > bPos) {
      return 1;
    }
    return 0;
  });

  return sortedIGroup;
}

function convertCommandToInteractionStep(interaction: ICommand): IInteractionStep {
  switch (interaction) {
    case Command.move: {
      return { command: CoreCommand.move };
      break;
    }
    case Command.scroll: {
      return { command: CoreCommand.scroll };
      break;
    }
    case Command.click: {
      return { command: CoreCommand.click };
      break;
    }
    case Command.clickLeft: {
      return { command: CoreCommand.click, mouseButton: MouseButton.left };
      break;
    }
    case Command.clickMiddle: {
      return { command: CoreCommand.click, mouseButton: MouseButton.middle };
      break;
    }
    case Command.clickRight: {
      return { command: CoreCommand.click, mouseButton: MouseButton.right };
      break;
    }
    case Command.doubleclick: {
      return { command: CoreCommand.doubleclick };
      break;
    }
    case Command.doubleclickLeft: {
      return { command: CoreCommand.doubleclick, mouseButton: MouseButton.left };
      break;
    }
    case Command.doubleclickMiddle: {
      return { command: CoreCommand.doubleclick, mouseButton: MouseButton.middle };
      break;
    }
    case Command.doubleclickRight: {
      return { command: CoreCommand.doubleclick, mouseButton: MouseButton.right };
      break;
    }
    case Command.clickUp: {
      return { command: CoreCommand.clickUp };
      break;
    }
    case Command.clickUpLeft: {
      return { command: CoreCommand.clickUp, mouseButton: MouseButton.left };
      break;
    }
    case Command.clickUpMiddle: {
      return { command: CoreCommand.clickUp, mouseButton: MouseButton.middle };
      break;
    }
    case Command.clickUpRight: {
      return { command: CoreCommand.clickUp, mouseButton: MouseButton.right };
      break;
    }
    case Command.clickDown: {
      return { command: CoreCommand.clickDown };
      break;
    }
    case Command.clickDownLeft: {
      return { command: CoreCommand.clickDown, mouseButton: MouseButton.left };
      break;
    }
    case Command.clickDownMiddle: {
      return { command: CoreCommand.clickDown, mouseButton: MouseButton.middle };
      break;
    }
    case Command.clickDownRight: {
      return { command: CoreCommand.clickDown, mouseButton: MouseButton.right };
      break;
    }
    default: {
      throw new Error(`unsupported command string: ${interaction}`);
    }
  }
}
