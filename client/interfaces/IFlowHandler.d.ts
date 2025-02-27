import IDomState from '@ulixee/hero-interfaces/IDomState';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import DomState from '../lib/DomState';
export default interface IFlowHandler {
    id?: number;
    name: string;
    state: IDomState | DomState;
    handlerFn: (error?: Error) => Promise<any>;
    callsitePath: ISourceCodeLocation[];
}
