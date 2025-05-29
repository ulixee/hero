import IViewport from '@ulixee/unblocked-specification/agent/browser/IViewport';
import Browser from '@ulixee/unblocked-agent/lib/Browser';
import ChromeEngine from '@ulixee/unblocked-agent/lib/ChromeEngine';
import { IBrowserContextHooks, IBrowserHooks } from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import IBrowser from '@ulixee/unblocked-specification/agent/browser/IBrowser';
export declare const defaultBrowserEngine: ChromeEngine;
export declare const defaultHooks: {
    onNewBrowser(b: any): void;
};
export declare const newPoolOptions: {
    defaultBrowserEngine: ChromeEngine;
};
export declare const browserEngineOptions: ChromeEngine;
export declare function createDefaultBrowser(): Browser;
export declare class PageHooks implements IBrowserHooks, IBrowserContextHooks {
    viewport: IViewport;
    locale: string;
    timezoneId: string;
    userAgentString: string;
    operatingSystemPlatform: string;
    constructor(config?: {
        locale?: string;
        viewport?: IViewport;
        timezoneId?: string;
        userAgent?: string;
        osPlatform?: string;
    });
    onNewPage(page: any): Promise<void>;
    onNewBrowser(browser: IBrowser): Promise<void>;
}
