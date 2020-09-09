import { IPuppetPage } from "./IPuppetPage";
import IBrowserEmulation from "./IBrowserEmulation";

export default interface IPuppetContext {
  emulation: IBrowserEmulation;
  newPage(): Promise<IPuppetPage>;
  close(): Promise<void>;
}
