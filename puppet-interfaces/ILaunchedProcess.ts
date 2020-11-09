import IConnectionTransport from './IConnectionTransport';

export default interface ILaunchedProcess {
  close: () => void;
  transport: IConnectionTransport;
}
