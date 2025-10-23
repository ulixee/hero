import IUserAgentOption from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
import IBrowserData, { IDataBrowserConfig, IDataClienthello, IDataCodecs, IDataDomPolyfill, IDataFonts, IDataHeaders, IDataHttp2Settings, IDataSpeechVoices, IDataWindowChrome, IDataWindowFraming, IDataWindowNavigator } from '../interfaces/IBrowserData';
import DataLoader from './DataLoader';
export default class BrowserData implements IBrowserData {
    static localOsMeta: {
        name: string;
        version: string;
    };
    private readonly dataLoader;
    private readonly baseDataDir;
    private readonly osDataDir;
    private domPolyfillFilename;
    constructor(dataLoader: DataLoader, userAgentOption: IUserAgentOption);
    get pkg(): any;
    get headers(): IDataHeaders;
    get windowBaseFraming(): IDataWindowFraming;
    get browserConfig(): IDataBrowserConfig;
    get clienthello(): IDataClienthello;
    get codecs(): IDataCodecs;
    get userAgentHints(): IDataCodecs;
    get speech(): IDataSpeechVoices;
    get fonts(): IDataFonts;
    get http2Settings(): IDataHttp2Settings;
    get windowChrome(): IDataWindowChrome;
    get windowFraming(): IDataWindowFraming;
    get windowNavigator(): IDataWindowNavigator;
    get domPolyfill(): IDataDomPolyfill;
}
export declare function createOsId(userAgentOption: IUserAgentOption): string;
export declare function createBrowserId(userAgentOption: IUserAgentOption): string;
