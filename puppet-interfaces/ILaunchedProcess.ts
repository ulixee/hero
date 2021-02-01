import IConnectionTransport from './IConnectionTransport';

export default interface ILaunchedProcess {
  close: () => Promise<void>;
  transport: IConnectionTransport;
}
