import BrowserContext from './BrowserContext';
import ICommandMarker from '../interfaces/ICommandMarker';
interface IMarker {
    id: number;
    action: string;
}
export declare class DefaultCommandMarker implements ICommandMarker {
    readonly browserContext: BrowserContext;
    get lastId(): number;
    get last(): IMarker;
    markers: IMarker[];
    private commandMarkerId;
    private waitForLocationStartingMark;
    private logger;
    constructor(browserContext: BrowserContext);
    incrementMark(action: string): void;
    getStartingCommandIdFor(marker: 'waitForLocation'): number;
}
export {};
