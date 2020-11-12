import {
  IInteractionGroup,
  IInteractionGroups,
  IMousePosition,
  IMousePositionXY,
  InteractionCommand,
} from '@secret-agent/core-interfaces/IInteractions';
import { assert } from '@secret-agent/commons/utils';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import {
  getKeyboardKey,
  IKeyboardKey,
  KeyboardKeys,
} from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import IInteractionsHelper from '@secret-agent/core-interfaces/IInteractionsHelper';
import IRect from '@secret-agent/core-interfaces/IRect';
import IWindowOffset from '@secret-agent/core-interfaces/IWindowOffset';
import Tab from './Tab';

const commandsNeedingScroll = [
  InteractionCommand.click,
  InteractionCommand.doubleclick,
  InteractionCommand.move,
];

export default class Interactor implements IInteractionsHelper {
  public get mousePosition() {
    return { ...this.mouse.position };
  }

  public get scrollOffset() {
    return this.tab.domEnv.getWindowOffset().then(offset => {
      return {
        x: offset.pageXOffset,
        y: offset.pageYOffset,
      };
    });
  }

  public get viewport() {
    return this.tab.session.viewport;
  }

  private readonly tab: Tab;

  private get mouse() {
    return this.tab.puppetPage.mouse;
  }

  private get keyboard() {
    return this.tab.puppetPage.keyboard;
  }

  private get humanEmulator() {
    return this.tab.session.humanEmulator;
  }

  constructor(tab: Tab) {
    this.tab = tab;
  }

  public async initialize() {
    if (this.humanEmulator.getStartingMousePoint) {
      this.mouse.position = await this.humanEmulator.getStartingMousePoint(this);
    }
  }

  public async play(interactions: IInteractionGroups) {
    const finalInteractions = Interactor.injectScrollToPositions(interactions);

    const humanEmulator = this.humanEmulator;

    await humanEmulator.playInteractions(
      finalInteractions,
      async interaction => {
        switch (interaction.command) {
          case InteractionCommand.move: {
            const { x, y } = await this.getPositionXY(interaction.mousePosition);
            await this.mouse.move(x, y);
            break;
          }
          case InteractionCommand.scroll: {
            const windowBounds = await this.tab.domEnv.getWindowOffset();
            const scroll = await this.getScrollOffset(interaction.mousePosition, windowBounds);

            if (scroll) {
              const { deltaY, deltaX } = scroll;
              await this.mouse.wheel(scroll);
              // need to check for offset since wheel event doesn't wait for scroll
              await this.tab.domEnv.waitForScrollOffset(
                Math.max(0, deltaX + windowBounds.pageXOffset),
                Math.max(0, deltaY + windowBounds.pageYOffset),
              );
            }
            break;
          }

          case InteractionCommand.click:
          case InteractionCommand.doubleclick: {
            const button = interaction.mouseButton || 'left';
            const { x, y, simulateOptionClick } = await this.getPositionXY(
              interaction.mousePosition,
            );

            if (simulateOptionClick) {
              await this.tab.domEnv.simulateOptionClick(interaction.mousePosition as IJsPath);
            } else {
              const clickCount = interaction.command === InteractionCommand.doubleclick ? 2 : 1;
              await this.mouse.click(x, y, { button, clickCount, delay: interaction.delayMillis });
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

          case InteractionCommand.type: {
            let counter = 0;
            for (const keyboardCommand of interaction.keyboardCommands) {
              const delay = interaction.keyboardDelayBetween;
              const keyupDelay = interaction.keyboardKeyupDelay;
              if (counter > 0 && delay) {
                await new Promise(resolve => setTimeout(resolve, delay));
              }

              if ('keyCode' in keyboardCommand) {
                const key = getKeyboardKey(keyboardCommand.keyCode);
                await this.keyboard.press(key, keyupDelay);
              } else if ('up' in keyboardCommand) {
                const key = getKeyboardKey(keyboardCommand.up);
                await this.keyboard.up(key);
              } else if ('down' in keyboardCommand) {
                const key = getKeyboardKey(keyboardCommand.down);
                await this.keyboard.down(key);
              } else if ('string' in keyboardCommand) {
                const text = keyboardCommand.string;
                for (const char of text) {
                  if (char in KeyboardKeys) {
                    await this.keyboard.press(char as IKeyboardKey, keyupDelay);
                  } else {
                    await this.keyboard.sendCharacter(char);
                  }
                  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
                }
              }
              counter += 1;
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
      },
      this,
    );
  }

  public async lookupBoundingRect(
    mousePosition: IMousePosition,
  ): Promise<IRect & { elementTag?: string }> {
    if (isMousePositionCoordinate(mousePosition)) {
      return { x: mousePosition[0] as number, y: mousePosition[1] as number, width: 1, height: 1 };
    }
    const rect = await this.tab.domEnv.getJsPathClientRect(mousePosition as IJsPath);

    return {
      x: rect.left,
      y: rect.top,
      height: rect.height,
      width: rect.width,
      elementTag: rect.tag,
    };
  }

  private async getScrollOffset(targetPosition: IMousePosition, windowBounds: IWindowOffset) {
    assert(targetPosition, 'targetPosition should not be null');

    if (isMousePositionCoordinate(targetPosition)) {
      const [x, y] = targetPosition as IMousePositionXY;
      const deltaX = x - windowBounds.pageXOffset;
      const deltaY = y - windowBounds.pageYOffset;
      return { deltaX, deltaY };
    }

    const rect = await this.lookupBoundingRect(targetPosition);

    const deltaY = deltaToFullyVisible(rect.y, rect.height, windowBounds.innerHeight);
    const deltaX = deltaToFullyVisible(rect.x, rect.width, windowBounds.innerWidth);

    if (deltaY === 0 && deltaX === 0) return null;
    return { deltaX, deltaY };
  }

  private async getPositionXY(mousePosition: IMousePosition) {
    assert(mousePosition, 'mousePosition should not be null');
    if (isMousePositionCoordinate(mousePosition)) {
      const [x, y] = mousePosition as number[];
      return { x: round(x), y: round(y) };
    }
    const rect = await this.tab.domEnv.getJsPathClientRect(mousePosition as IJsPath);
    if (rect.bottom === 0 && rect.height === 0 && rect.width === 0 && rect.right === 0) {
      return { x: 0, y: 0, simulateOptionClick: rect.tag === 'option' };
    }

    // Default is to find exact middle. An emulator should replace an entry with a coordinate to avoid this functionality
    let x = round(rect.left + rect.width / 2);
    let y = round(rect.top + rect.height / 2);
    // if coordinates go out of screen, bring back
    if (x > this.viewport.width) x = this.viewport.width - 1;
    if (y > this.viewport.height) y = this.viewport.height - 1;
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

export function deltaToFullyVisible(coordinate: number, length: number, boundaryLength: number) {
  if (coordinate >= 0) {
    if (length > boundaryLength) {
      length = boundaryLength / 2;
    }
    const bottom = Math.round(coordinate + length);
    // end passes boundary
    if (bottom > boundaryLength) {
      return -Math.round(boundaryLength - bottom);
    }
  } else {
    const top = Math.round(coordinate);
    if (top < 0) {
      return top;
    }
  }
  return 0;
}

function round(num: number) {
  return Math.round(10 * num) / 10;
}
