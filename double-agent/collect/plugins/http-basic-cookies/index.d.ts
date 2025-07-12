import Plugin from '@double-agent/collect/lib/Plugin';
import IPlugin from '@double-agent/collect/interfaces/IPlugin';
export default class HttpCookiesPlugin extends Plugin {
    initialize(): void;
    changePluginOrder(plugins: IPlugin[]): void;
    private start;
    private saveLoadAssetsAndReadFromJs;
    private saveFromJs;
    private saveFromCss;
    private redirectToNextPage;
    private saveAndRedirectToNextPage;
    private setAndRedirectToNextPage;
    private set;
    private save;
    private saveCreatedCookiesToProfile;
    private saveCollectedCookiesToProfile;
}
