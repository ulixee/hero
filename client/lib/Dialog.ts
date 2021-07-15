import StateMachine from 'awaited-dom/base/StateMachine';
import CoreTab from './CoreTab';

const { getState, setState } = StateMachine<Dialog, IState>();

interface IState {
  coreTab: Promise<CoreTab>;
}

export default class Dialog {
  url: string;
  message: string;
  type: 'alert' | 'confirm' | 'prompt' | 'beforeunload';
  hasBrowserHandler: boolean;
  defaultPrompt?: string;

  async dismiss(accept: boolean, promptText?: string): Promise<void> {
    const coreTab = await getState(this).coreTab;
    return coreTab.dismissDialog(accept, promptText);
  }
}

export function createDialog(coreTab: Promise<CoreTab>, data: Omit<Dialog, 'dismiss'>): Dialog {
  const dialog = new Dialog();
  Object.assign(dialog, data);
  setState(dialog, { coreTab });
  return dialog;
}
