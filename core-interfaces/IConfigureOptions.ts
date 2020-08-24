export default interface IConfigureOptions {
  maxActiveSessionCount?: number;
  localProxyPortStart?: number;
  replayServerPort?: number;
  sessionsDir?: string;
  activeEmulatorIds?: string[];
}
