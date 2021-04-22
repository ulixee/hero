import ICreateSessionOptions from './ICreateSessionOptions';

export default interface IConfigureSessionOptions
  extends Pick<
    ICreateSessionOptions,
    | 'userProfile'
    | 'viewport'
    | 'timezoneId'
    | 'locale'
    | 'upstreamProxyUrl'
    | 'blockedResourceTypes'
  > {}
