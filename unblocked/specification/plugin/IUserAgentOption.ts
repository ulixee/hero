export default interface IUserAgentOption {
  browserName: string;
  browserVersion: IVersion;
  operatingSystemName: string;
  operatingSystemVersion: IVersion;
  uaClientHintsPlatformVersion: string;
  string: string;
}

export interface IVersion {
  major: string;
  minor: string;
  patch?: string;
  build?: string;
}
