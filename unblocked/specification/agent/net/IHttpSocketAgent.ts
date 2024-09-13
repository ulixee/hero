import IHttpSocketConnectOptions from './IHttpSocketConnectOptions';
import IHttpSocketWrapper from './IHttpSocketWrapper';

export default interface IHttpSocketAgent {
  createSocketConnection(options: IHttpSocketConnectOptions): Promise<IHttpSocketWrapper>;
}
