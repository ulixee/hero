import IViewport from "@secret-agent/core-interfaces/IViewport";

export default interface IBrowserEmulation {
  userAgent: string;
  locale: string;
  platform: string;
  proxyPassword: string;
  viewport: IViewport;
  timezoneId?: string;
}
