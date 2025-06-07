import type { IDomPaintEvent } from '@ulixee/unblocked-specification/agent/browser/Location';
declare global {
    interface Window {
        PaintEvents: PaintEvents;
    }
}
declare class PaintEvents {
    onEventCallbackFn: (event: IDomPaintEvent, timestamp: number, url: string) => void;
    constructor();
    eventTriggered(event: IDomPaintEvent): void;
}
export {};
