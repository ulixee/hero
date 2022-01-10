import IHttpResourceLoadDetails from '@ulixee/hero-interfaces/IHttpResourceLoadDetails';

export default interface IBrowserRequestMatcher {
  cancelPending(): void;
  determineResourceType(resource: IHttpResourceLoadDetails): void;
}
