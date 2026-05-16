import { ISuperElement, ISuperNode, ISuperHTMLElement, ISuperNodeList, ISuperHTMLCollection } from '@ulixee/awaited-dom/base/interfaces/super';
import AwaitedPath from '@ulixee/awaited-dom/base/AwaitedPath';
import { INodePointer } from '@ulixee/js-path';
import { IElementInteractVerification } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import SuperDocument from '@ulixee/awaited-dom/impl/super-klasses/SuperDocument';
import { IElement, IHTMLCollection, IHTMLElement, INode, INodeList } from '@ulixee/awaited-dom/base/interfaces/official';
import { ITypeInteraction } from '../interfaces/IInteractions';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
declare const awaitedPathState: {
    getState: (instance: any) => {
        awaitedPath: AwaitedPath;
        awaitedOptions: IAwaitedOptions;
        nodePointer?: INodePointer;
    };
    setState: (instance: any, properties: Partial<{
        awaitedPath: AwaitedPath;
        awaitedOptions: IAwaitedOptions;
        nodePointer?: INodePointer;
    }>) => void;
};
interface IBaseExtendNode {
    $isVisible: Promise<boolean>;
    $exists: Promise<boolean>;
    $isClickable: Promise<boolean>;
    $hasFocus: Promise<boolean>;
    $contentDocument: SuperDocument;
    $clearInputText(): Promise<void>;
    $click(verification?: IElementInteractVerification): Promise<void>;
    $type(...typeInteractions: ITypeInteraction[]): Promise<void>;
    $waitForExists(options?: {
        timeoutMs?: number;
    }): Promise<ISuperElement>;
    $waitForClickable(options?: {
        timeoutMs?: number;
    }): Promise<ISuperElement>;
    $waitForHidden(options?: {
        timeoutMs?: number;
    }): Promise<ISuperElement>;
    $waitForVisible(options?: {
        timeoutMs?: number;
    }): Promise<ISuperElement>;
    $xpathSelector(selector: string): ISuperNode;
    $detach(): Promise<globalThis.Element>;
    $addToDetachedElements(name: string): Promise<void>;
}
interface IBaseExtendNodeList {
    $map<T = any>(iteratorFn: (node: ISuperNode, index: number) => Promise<T>): Promise<T[]>;
    $reduce<T = any>(iteratorFn: (initial: T, node: ISuperNode) => Promise<T>, initial: T): Promise<T>;
    $detach(): Promise<globalThis.Element[]>;
    $addToDetachedElements(name?: string): Promise<void>;
}
declare module '@ulixee/awaited-dom/base/interfaces/super' {
    interface ISuperElement extends IBaseExtendNode {
    }
    interface ISuperNode extends IBaseExtendNode {
    }
    interface ISuperHTMLElement extends IBaseExtendNode {
    }
    interface ISuperNodeList extends IBaseExtendNodeList {
    }
    interface ISuperHTMLCollection extends IBaseExtendNodeList {
    }
}
declare module '@ulixee/awaited-dom/base/interfaces/official' {
    interface IElement extends IBaseExtendNode {
    }
    interface INode extends IBaseExtendNode {
    }
    interface IHTMLElement extends IBaseExtendNode {
    }
    interface INodeList extends IBaseExtendNodeList {
    }
    interface IHTMLCollection extends IBaseExtendNodeList {
    }
}
export declare function extendNodes<IFunctions, IGetters>(functions: IFunctions, getters?: IGetters): void;
export declare function extendNodeLists(functions: {
    [name: string]: any;
}): void;
export declare function isDomExtensionClass(instance: any): boolean;
export type IDomExtensionClass = ISuperElement | ISuperNode | ISuperHTMLElement | IElement | INode | IHTMLElement | ISuperNodeList | ISuperHTMLCollection | INodeList | IHTMLCollection;
export { awaitedPathState };
