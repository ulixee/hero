import IHttpResourceLoadDetails from '@ulixee/unblocked-specification/agent/net/IHttpResourceLoadDetails';
import IMitmRequestContext from './IMitmRequestContext';
export default interface IBrowserRequestMatcher {
    cancelPending(): void;
    resolveBrowserRequest(resource: IHttpResourceLoadDetails): void;
    determineResourceType(resource: IHttpResourceLoadDetails): void;
    onInitialize(resource: IMitmRequestContext): void;
}
