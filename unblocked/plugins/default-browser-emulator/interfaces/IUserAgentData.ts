export default interface IUserAgentData {
  brands: { brand: string; version: string }[];
  platform: string;
  platformVersion: string;
  uaFullVersion: string;
  architecture?: string;
  model?: string;
  mobile?: boolean;
}
