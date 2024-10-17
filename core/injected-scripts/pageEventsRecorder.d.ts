import type { IDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';
import type { IMouseEvent } from '@ulixee/hero-interfaces/IMouseEvent';
import type { IFocusEvent } from '@ulixee/hero-interfaces/IFocusEvent';
import type { IScrollEvent } from '@ulixee/hero-interfaces/IScrollEvent';
import type { ILoadEvent } from '@ulixee/hero-interfaces/ILoadEvent';
interface ITypeSerializer {
    stringify(object: any): string;
    parse(object: string): any;
    replace(object: any): any;
}
declare global {
    let TypeSerializer: ITypeSerializer;
    interface Window {
        extractDomChanges(): PageRecorderResultSet;
        flushPageRecorder(id: string): void;
        checkForShadowRoot(path: {
            localName: string;
            id: string;
            index: number;
            hasShadowHost: boolean;
        }[]): void;
        listenToInteractionEvents(): void;
        trackElement(element: Element): void;
        doNotTrackElement(element: Element): void;
    }
}
export type PageRecorderResultSet = [
    IDomChangeEvent[],
    IMouseEvent[],
    IFocusEvent[],
    IScrollEvent[],
    ILoadEvent[],
    string?
];
export {};
