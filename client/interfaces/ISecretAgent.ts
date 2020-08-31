import IConfigureOptions from '@secret-agent/core-interfaces/IConfigureOptions';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import { IRenderingOption } from '@secret-agent/core-interfaces/IWindowOptions';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import Browser from '../lib/Browser';

export interface ISecretAgentConfigureOptions extends IConfigureOptions {
  defaultRenderingOptions: IRenderingOption[];
  defaultUserProfile: IUserProfile;
}
export default interface ISecretAgent {
  // private options: ISecretAgentConfigureOptions;
  configure(options: Partial<ISecretAgentConfigureOptions>): Promise<void>;
  createBrowser(options?: Partial<ICreateSessionOptions>): Promise<Browser>;
  start(options?: Partial<ISecretAgentConfigureOptions>): Promise<void>;
  shutdown(): Promise<void>;
}

// hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SecretAgentStatics(constructor: ISecretAgent) {}
