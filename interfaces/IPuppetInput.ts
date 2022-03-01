import { IKeyboardKey } from './IKeyboardLayoutUS';
import { IMouseButton } from './IInteractions';
import IPoint from './IPoint';

export interface IPuppetKeyboard {
  up(key: IKeyboardKey): Promise<void>;
  down(key: IKeyboardKey): Promise<void>;
  press(key: IKeyboardKey, keyupDelay?: number): Promise<void>;
  command(command: string): Promise<void>;
  insertText(text: string): Promise<void>;
  sendCharacter(char: string): Promise<void>;
}

export interface IPuppetMouse {
  position: IPoint;
  move(x: number, y: number): Promise<void>;
  up(options?: IMouseOptions): Promise<void>;
  down(options?: IMouseOptions): Promise<void>;
  wheel(options: { deltaX?: number; deltaY?: number }): Promise<void>;
}

export interface IMouseOptions {
  button?: IMouseButton;
  clickCount?: number;
}
