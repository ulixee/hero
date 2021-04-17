import IViewport from '@secret-agent/core-interfaces/IViewport';

export default interface IBrowserEmulationSettings {
  userAgent: string;
  locale: string;
  platform: string;
  proxyAddress?: string;
  proxyPassword: string;
  viewport: IViewport;
  timezoneId?: string;
}
