import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
import { IDataWindowFraming } from '../interfaces/IBrowserData';
export declare const defaultScreen: {
    width: number;
    height: number;
    scale: number;
};
export default class Viewports {
    static getDefault(windowBaseFraming: IDataWindowFraming, windowFraming: IDataWindowFraming): IViewport;
}
