import CoreTab from "../lib/CoreTab";
import { ISecretAgent } from "./ISecretAgent";

export default interface IAwaitedOptions {
  secretAgent: ISecretAgent;
  coreTab: Promise<CoreTab>;
}
