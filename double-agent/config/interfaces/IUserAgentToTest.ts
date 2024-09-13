export default interface IUserAgentToTest {
  browserId: string;
  operatingSystemId: string;
  pickTypes: IUserAgentToTestPickType[];
  usagePercent: IUserAgentToTestUsagePercent;
  string: string;
}

export interface IUserAgentToTestUsagePercent {
  [UserAgentToTestPickType.popular]: number;
  [UserAgentToTestPickType.random]: number;
}

export enum UserAgentToTestPickType {
  popular = 'popular',
  random = 'random',
}

export type IUserAgentToTestPickType = keyof typeof UserAgentToTestPickType;
