import {
  IInteractionGroup,
  IInteractionGroups,
  IKeyboardDown,
  IKeyboardString,
  IKeyboardUp,
  IKeyPress,
  IMousePosition,
  IMousePositionXY,
  InteractionCommand,
} from '@secret-agent/core-interfaces/IInteractions';
import { assert } from '@secret-agent/commons/utils';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { getKeyboardKey } from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import Tab from './Tab';

const commandsNeedingScroll = [
  InteractionCommand.click,
  InteractionCommand.doubleclick,
  InteractionCommand.move,
];

export default class Interactor {
  private readonly tab: Tab;

  private get mouse() {
    return this.tab.puppetPage.mouse;
  }

  private get keyboard() {
    return this.tab.puppetPage.keyboard;
  }

  constructor(tab: Tab) {
    this.tab = tab;
  }

  public async play(interactions: IInteractionGroups) {
    const finalInteractions = Interactor.injectScrollToPositions(interactions);

    const humanoid = this.tab.session.humanoid;

    await humanoid.playInteractions(finalInteractions, async interaction => {
      switch (interaction.command) {
        case InteractionCommand.move: {
          const { x, y } = await this.getPositionXY(interaction.mousePosition);
          await this.mouse.move(x, y, { steps: interaction.mouseSteps || 1 });
          break;
        }
        case InteractionCommand.scroll: {
          if (isMousePositionCoordinate(interaction.mousePosition)) {
            await this.tab.scrollCoordinatesIntoView(
              interaction.mousePosition as IMousePositionXY,
            );
          } else {
            await this.tab.scrollJsPathIntoView(interaction.mousePosition as IJsPath);
          }
          break;
        }

        case InteractionCommand.click: {
          const button = interaction.mouseButton || 'left';
          const { x, y, simulateOptionClick } = await this.getPositionXY(interaction.mousePosition);
          if (simulateOptionClick) {
            await this.tab.domEnv.simulateOptionClick(interaction.mousePosition as IJsPath);
          } else {
            await this.mouse.click(x, y, { button });
          }
          break;
        }
        case InteractionCommand.clickUp: {
          const button = interaction.mouseButton || 'left';
          await this.mouse.up({ button });
          break;
        }
        case InteractionCommand.clickDown: {
          const button = interaction.mouseButton || 'left';
          await this.mouse.down({ button });
          break;
        }

        case InteractionCommand.doubleclick: {
          const button = interaction.mouseButton || 'left';
          const { x, y } = await this.getPositionXY(interaction.mousePosition);
          await this.mouse.click(x, y, { button, clickCount: 2 });
          break;
        }

        case InteractionCommand.type: {
          for (const keyboardCommand of interaction.keyboardCommands) {
            if ('keyCode' in keyboardCommand) {
              const key = getKeyboardKey((keyboardCommand as IKeyPress).keyCode);
              await this.keyboard.press(key);
            } else if ((keyboardCommand as IKeyboardString).string) {
              const delay = interaction.keyboardDelayBetween || 0;
              await this.keyboard.type((keyboardCommand as IKeyboardString).string, { delay });
            } else if ('up' in keyboardCommand) {
              const key = getKeyboardKey((keyboardCommand as IKeyboardUp).up);
              await this.keyboard.up(key);
            } else if ('down' in keyboardCommand) {
              const key = getKeyboardKey((keyboardCommand as IKeyboardDown).down);
              await this.keyboard.down(key);
            }
          }
          break;
        }

        case InteractionCommand.waitForNode: {
          await this.tab.waitForNode(interaction.delayNode);
          break;
        }
        case InteractionCommand.waitForElementVisible: {
          await this.tab.waitForElement(interaction.delayElement, { waitForVisible: true });
          break;
        }
        case InteractionCommand.waitForMillis: {
          await new Promise(resolve => setTimeout(resolve, interaction.delayMillis));
          break;
        }
      }
    });
  }

  private async getPositionXY(value: IMousePosition) {
    // ToDo: we need to pass in randomized factor from Humanoid so point can change.
    assert(value, 'value should not be null');
    if (isMousePositionCoordinate(value)) {
      return { x: value[0] as number, y: value[1] as number };
    }
    const rect = await this.tab.domEnv.getJsPathClientRect(value as IJsPath);
    const x = round(rect.left + (rect.right - rect.left) / 2);
    const y = round(rect.top - (rect.top - rect.bottom) / 2);
    if (rect.bottom === 0 && rect.height === 0 && rect.width === 0 && rect.right === 0) {
      return { x: 0, y: 0, simulateOptionClick: rect.tag === 'option' };
    }
    return { x, y };
  }

  private static injectScrollToPositions(interactions: IInteractionGroups) {
    const finalInteractions: IInteractionGroups = [];
    for (const group of interactions) {
      const groupCommands: IInteractionGroup = [];
      finalInteractions.push(groupCommands);
      for (const step of group) {
        if (
          commandsNeedingScroll.includes(InteractionCommand[step.command]) &&
          step.mousePosition
        ) {
          groupCommands.push({
            command: InteractionCommand.scroll,
            mousePosition: step.mousePosition,
          });
        }
        groupCommands.push(step);
      }
    }
    return finalInteractions;
  }
}

export function isMousePositionCoordinate(value: IMousePosition) {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === 'number';
}

function round(num: number) {
  return Math.round(10 * num) / 10;
}
