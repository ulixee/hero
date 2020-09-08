import { IKeyboardKey } from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import { IMouseButton } from '@secret-agent/core-interfaces/IInteractions';

export interface IPuppetKeyboard {
  up(key: IKeyboardKey): Promise<void>;
  down(key: IKeyboardKey): Promise<void>;
  press(key: IKeyboardKey): Promise<void>;
  type(text: string, options: { delay: number }): Promise<void>;
}

export interface IPuppetMouse {
  move(x: number, y: number, options?: { steps?: number }): Promise<void>;
  click(x: number, y: number, options?: IMouseOptions & { delay?: number }): Promise<void>;
  up(options?: IMouseOptions): Promise<void>;
  down(options?: IMouseOptions): Promise<void>;
  wheel(options: { deltaX?: number; deltaY?: number }): Promise<void>;
}

export interface IMouseOptions {
  button?: IMouseButton;
  clickCount?: number;
}
