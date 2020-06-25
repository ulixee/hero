export default interface IUserAgent {
  platform: string;
  family: string;
  vendor: string;
  os: {
    family: string;
    major: string;
    minor: string;
  };
  raw: string;
  deviceCategory: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  weight: number;
}
