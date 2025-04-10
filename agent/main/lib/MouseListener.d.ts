import IMouseResult from '@ulixee/unblocked-specification/agent/interact/IMouseResult';
import { INodeVisibility } from '@ulixee/js-path';
import IWindowOffset from '@ulixee/unblocked-specification/agent/browser/IWindowOffset';
import Frame from './Frame';
export default class MouseListener {
    private readonly frame;
    private readonly nodeId;
    constructor(frame: Frame, nodeId: number);
    register(): Promise<INodeVisibility>;
    didTriggerMouseEvent(): Promise<IMouseResult>;
    static waitForScrollStop(frame: Frame, timeoutMs?: number): Promise<[scrollX: number, scrollY: number]>;
    static getWindowOffset(frame: Frame): Promise<IWindowOffset>;
}
