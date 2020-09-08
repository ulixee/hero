import { IPuppetPage } from "./IPuppetPage";
import IBrowserEmulation from "./IBrowserEmulation";

export default interface IPuppetContext {
  emulation: IBrowserEmulation;
  newPage(): Promise<IPuppetPage>;
  close(): Promise<void>;
  // used to translate the networkId sent to a proxy to the corresponding page
  getPageForNetworkId(networkId: string): IPuppetPage;
}
