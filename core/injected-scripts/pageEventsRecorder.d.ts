import type { IDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';
import type { IMouseEvent } from '@ulixee/hero-interfaces/IMouseEvent';
import type { IFocusEvent } from '@ulixee/hero-interfaces/IFocusEvent';
import type { IScrollEvent } from '@ulixee/hero-interfaces/IScrollEvent';
import type { ILoadEvent } from '@ulixee/hero-interfaces/ILoadEvent';
import type ITypeSerializer from '@ulixee/commons/interfaces/ITypeSerializer';
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
