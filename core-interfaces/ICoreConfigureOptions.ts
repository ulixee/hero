export default interface ICoreConfigureOptions {
  maxConcurrentSessionsCount?: number;
  localProxyPortStart?: number;
  replayServerPort?: number;
  sessionsDir?: string;
  browserEmulatorIds?: string[];
}
