import IHttpResourceLoadDetails from '@ulixee/unblocked-specification/agent/net/IHttpResourceLoadDetails';

export default interface IBrowserRequestMatcher {
  cancelPending(): void;
  resolveBrowserRequest(resource: IHttpResourceLoadDetails): void;
  determineResourceType(resource: IHttpResourceLoadDetails): void;
}
