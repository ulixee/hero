import IPuppetContext from "./IPuppetContext";
import IBrowserEmulation from "./IBrowserEmulation";

export default interface IPuppetBrowser {
  newContext(emulation: IBrowserEmulation): Promise<IPuppetContext>;
  close(): Promise<void>;
}
