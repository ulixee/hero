export default interface IUserAgentMatchMeta {
  browser: {
    id: string;
    name: string;
    version: {
      major: number;
      minor: number;
    }
  };
  operatingSystem: {
    id: string;
    name: string;
    version: {
      major: number;
      minor: number;
    }
  };
}
