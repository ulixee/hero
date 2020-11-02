export default interface IConfigureOptions {
  maxConcurrentSessionsCount?: number;
  localProxyPortStart?: number;
  replayServerPort?: number;
  sessionsDir?: string;
  activeEmulatorIds?: string[];
}
