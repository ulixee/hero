import CoreClientSession from '../lib/CoreClientSession';
import Browser from '../lib/Browser';

export default interface IAwaitedOptions {
  browser: Browser;
  coreClientSession: CoreClientSession;
}
