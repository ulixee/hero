export default interface IBrowserstackAgent {
  browser: string;
  browser_version: string;
  os: string;
  os_version: string;
  real_mobile?: boolean;
}
