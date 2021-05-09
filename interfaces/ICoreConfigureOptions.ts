export default interface ICoreConfigureOptions {
  maxConcurrentAgentsCount?: number;
  localProxyPortStart?: number;
  coreServerPort?: number;
  sessionsDir?: string;
}
