import IUserAgentToTest from '@double-agent/config/interfaces/IUserAgentToTest';
import IUserAgentConfig from '../interfaces/IUserAgentConfig';
declare function writeUserAgentsToTest(userAgentConfig: IUserAgentConfig, outFilePath: string): Promise<void>;
declare function collectUserAgentsToTest(userAgentConfig: IUserAgentConfig): Promise<IUserAgentToTest[]>;
export { writeUserAgentsToTest, collectUserAgentsToTest };
