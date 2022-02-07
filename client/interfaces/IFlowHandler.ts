import IDomState from '@ulixee/hero-interfaces/IDomState';
import DomState from '../lib/DomState';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';

export default interface IFlowHandler {
  id?: number;
  name: string;
  state: IDomState | DomState;
  handlerFn: (error?: Error) => Promise<any>;
  callsitePath: ISourceCodeLocation[];
}
