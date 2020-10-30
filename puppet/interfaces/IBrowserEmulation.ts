import IViewport from "@secret-agent/core-interfaces/IViewport";

export default interface IBrowserEmulation {
  userAgent: string;
  acceptLanguage: string;
  platform: string;
  proxyPassword: string;
  viewport: IViewport;
  timezoneId?: string;
}
