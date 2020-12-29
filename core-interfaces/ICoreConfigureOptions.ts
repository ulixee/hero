export default interface ICoreConfigureOptions {
  maxConcurrentAgentsCount?: number;
  localProxyPortStart?: number;
  replayServerPort?: number;
  sessionsDir?: string;
  browserEmulatorIds?: string[];
}
