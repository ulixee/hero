import CoreTab from './CoreTab';
export default class Dialog {
    #private;
    url: string;
    message: string;
    type: 'alert' | 'confirm' | 'prompt' | 'beforeunload';
    hasBrowserHandler: boolean;
    defaultPrompt?: string;
    constructor(coreTab: Promise<CoreTab>, data: Omit<Dialog, 'dismiss'>);
    dismiss(accept: boolean, promptText?: string): Promise<void>;
}
export declare function createDialog(coreTab: Promise<CoreTab>, data: Omit<Dialog, 'dismiss'>): Dialog;
