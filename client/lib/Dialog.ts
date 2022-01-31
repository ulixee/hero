import CoreTab from './CoreTab';

export default class Dialog {
  url: string;
  message: string;
  type: 'alert' | 'confirm' | 'prompt' | 'beforeunload';
  hasBrowserHandler: boolean;
  defaultPrompt?: string;

  #coreTab: Promise<CoreTab>;

  constructor(coreTab: Promise<CoreTab>, data: Omit<Dialog, 'dismiss'>) {
    this.#coreTab = coreTab;
    this.url = data.url;
    this.message = data.message;
    this.type = data.type;
    this.hasBrowserHandler = data.hasBrowserHandler;
    this.defaultPrompt = data.defaultPrompt;
  }

  async dismiss(accept: boolean, promptText?: string): Promise<void> {
    const coreTab = await this.#coreTab;
    return coreTab.dismissDialog(accept, promptText);
  }
}

export function createDialog(coreTab: Promise<CoreTab>, data: Omit<Dialog, 'dismiss'>): Dialog {
  return new Dialog(coreTab, data);
}
