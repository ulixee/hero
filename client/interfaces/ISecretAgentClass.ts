import IConfigureOptions from "@secret-agent/core-interfaces/IConfigureOptions";
import { IRenderingOption } from "@secret-agent/core-interfaces/ITabOptions";
import IUserProfile from "@secret-agent/core-interfaces/IUserProfile";
import ICreateSecretAgentOptions from './ICreateSecretAgentOptions';
import ISecretAgent from "./ISecretAgent";

export interface ISecretAgentConfigureOptions extends IConfigureOptions {
  defaultRenderingOptions: IRenderingOption[];
  defaultUserProfile: IUserProfile;
}
export default interface ISecretAgentClass {
  // private options: ISecretAgentConfigureOptions;
  configure(options: Partial<ISecretAgentConfigureOptions>): Promise<void>;
  prewarm(options?: Partial<ISecretAgentConfigureOptions>): Promise<void>;
  shutdown(): Promise<void>;
  new (options?: ICreateSecretAgentOptions): ISecretAgent;
}

// hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SecretAgentStatics(constructor: ISecretAgentClass) {}
