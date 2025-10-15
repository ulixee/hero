import ISessionCreateOptions from './ISessionCreateOptions';
export default interface IConfigureSessionOptions extends Pick<ISessionCreateOptions, 'userProfile' | 'viewport' | 'timezoneId' | 'locale' | 'upstreamProxyUrl' | 'upstreamProxyUseLocalDns' | 'blockedResourceTypes' | 'blockedResourceUrls' | 'interceptedResources'> {
}
