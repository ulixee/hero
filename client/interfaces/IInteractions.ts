import { ISuperElement, ISuperNode } from "awaited-dom/base/interfaces/super";
import { IMousePositionXY } from "@ulixee/hero-interfaces/IInteractions";
import { IKeyboardKeyCode } from "@ulixee/hero-interfaces/IKeyboardLayoutUS";

export type IInteraction = ICommand | ICommandDetailed;
type IInteractions = IInteraction[];

export default IInteractions;

export enum Command {
  scroll = 'scroll',
  move = 'move',

  click = 'click',
  clickLeft = 'clickLeft',
  clickMiddle = 'clickMiddle',
  clickRight = 'clickRight',

  clickDown = 'clickDown',
  clickDownLeft = 'clickDownLeft',
  clickDownMiddle = 'clickDownMiddle',
  clickDownRight = 'clickDownRight',

  clickUp = 'clickUp',
  clickUpLeft = 'clickUpLeft',
  clickUpMiddle = 'clickUpMiddle',
  clickUpRight = 'clickUpRight',

  doubleclick = 'doubleclick',
  doubleclickLeft = 'doubleclickLeft',
  doubleclickMiddle = 'doubleclickMiddle',
  doubleclickRight = 'doubleclickRight',

  keyPress = 'keyPress',
  keyDown = 'keyDown',
  keyUp = 'keyUp',
  type = 'type',

  waitForNode = 'waitForNode',
  waitForElementVisible = 'waitForElementVisible',
  waitForMillis = 'waitForMillis',
}

export type ICommand = keyof typeof Command;

export interface ICommandDetailed {
  [Command.scroll]?: IMousePosition;
  [Command.move]?: IMousePosition;
  [Command.click]?: IMousePosition;
  [Command.clickLeft]?: IMousePosition;
  [Command.clickMiddle]?: IMousePosition;
  [Command.clickRight]?: IMousePosition;
  [Command.doubleclick]?: IMousePosition;
  [Command.doubleclickLeft]?: IMousePosition;
  [Command.doubleclickMiddle]?: IMousePosition;
  [Command.doubleclickRight]?: IMousePosition;
  [Command.clickUp]?: IMousePosition;
  [Command.clickUpLeft]?: IMousePosition;
  [Command.clickUpMiddle]?: IMousePosition;
  [Command.clickUpRight]?: IMousePosition;
  [Command.clickDown]?: IMousePosition;
  [Command.clickDownLeft]?: IMousePosition;
  [Command.clickDownMiddle]?: IMousePosition;
  [Command.clickDownRight]?: IMousePosition;

  [Command.type]?: ITypeInteraction;
  [Command.keyPress]?: IKeyboardKeyCode;
  [Command.keyUp]?: IKeyboardKeyCode;
  [Command.keyDown]?: IKeyboardKeyCode;

  [Command.waitForNode]?: ISuperNode;
  [Command.waitForElementVisible]?: ISuperElement;
  [Command.waitForMillis]?: number;
}

export type ITypeInteraction = string | IKeyboardKeyCode;

export type IMousePosition = IMousePositionXY | ISuperElement;
