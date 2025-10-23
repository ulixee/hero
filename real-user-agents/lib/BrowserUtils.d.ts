import IBrowser from '../interfaces/IBrowser';
export declare function createBrowserId(browser: Pick<IBrowser, 'name' | 'version'>): string;
export declare function createBrowserIdFromUserAgentString(userAgentString: string): string;
