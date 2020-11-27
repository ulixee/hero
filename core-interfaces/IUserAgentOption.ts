export default interface IUserAgentOption {
  operatingSystemId: string;
  browserId: string;
  version: {
    major: string;
    minor: string;
    patch?: string;
  };
  string: string;
}
