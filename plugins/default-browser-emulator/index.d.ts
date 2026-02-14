import IUnblockedPlugin from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IDeviceProfile from '@ulixee/unblocked-specification/plugin/IDeviceProfile';
import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import IUserAgentOption from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
import IHttpResourceLoadDetails from '@ulixee/unblocked-specification/agent/net/IHttpResourceLoadDetails';
import IDnsSettings from '@ulixee/unblocked-specification/agent/net/IDnsSettings';
import ITcpSettings from '@ulixee/unblocked-specification/agent/net/ITcpSettings';
import ITlsSettings from '@ulixee/unblocked-specification/agent/net/ITlsSettings';
import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import { IWorker } from '@ulixee/unblocked-specification/agent/browser/IWorker';
import IHttp2ConnectSettings from '@ulixee/unblocked-specification/agent/net/IHttp2ConnectSettings';
import IHttpSocketAgent from '@ulixee/unblocked-specification/agent/net/IHttpSocketAgent';
import IBrowserUserConfig from '@ulixee/unblocked-specification/agent/browser/IBrowserUserConfig';
import IBrowser from '@ulixee/unblocked-specification/agent/browser/IBrowser';
import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import IBrowserData from './interfaces/IBrowserData';
import DomOverridesBuilder from './lib/DomOverridesBuilder';
import IUserAgentData from './interfaces/IUserAgentData';
import IBrowserEmulatorConfig from './interfaces/IBrowserEmulatorConfig';
export declare const defaultBrowserEngine: import("@ulixee/unblocked-specification/agent/browser/IBrowserEngineOption").default & {
    version: import("@ulixee/unblocked-specification/plugin/IUserAgentOption").IVersion;
};
export interface IEmulatorOptions {
    userAgentSelector?: string;
}
export declare const defaultConfig: {
    "JSON.stringify": boolean;
    console: boolean;
    "Document.prototype.cookie": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/Document.prototype.cookie").Args>;
    error: import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/error").Args>;
    "MediaDevices.prototype.enumerateDevices": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/MediaDevices.prototype.enumerateDevices").Args>;
    "navigator.deviceMemory": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/navigator.deviceMemory").Args>;
    "navigator.hardwareConcurrency": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/navigator.hardwareConcurrency").Args>;
    navigator: import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/navigator").Args>;
    performance: import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/performance").Args>;
    "polyfill.add": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/polyfill.add").Args>;
    "polyfill.modify": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/polyfill.modify").Args>;
    "polyfill.remove": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/polyfill.remove").Args>;
    "polyfill.reorder": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/polyfill.reorder").Args>;
    "RTCRtpSender.getCapabilities": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/RTCRtpSender.getCapabilities").Args>;
    "SharedWorker.prototype": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/SharedWorker.prototype").Args>;
    "speechSynthesis.getVoices": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/speechSynthesis.getVoices").Args>;
    UnhandledErrorsAndRejections: import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/UnhandledErrorsAndRejections").Args>;
    "WebGLRenderingContext.prototype.getParameter": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/WebGLRenderingContext.prototype.getParameter").Args>;
    webrtc: import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/webrtc").Args>;
    "window.screen": import("./interfaces/IBrowserEmulatorConfig").InjectedScriptConfig<import("./injected-scripts/window.screen").Args>;
};
export default class DefaultBrowserEmulator<T = IEmulatorOptions> implements IUnblockedPlugin<T> {
    #private;
    static id: string;
    static enableTcpEmulation: boolean;
    readonly logger: IBoundLog;
    readonly emulationProfile: IEmulationProfile<T>;
    readonly config: IBrowserEmulatorConfig;
    get userAgentString(): string;
    get browserEngine(): IBrowserEngine;
    get deviceProfile(): IDeviceProfile;
    protected get domOverridesBuilder(): DomOverridesBuilder;
    protected readonly data: IBrowserData;
    private readonly userAgentData;
    constructor(emulationProfile: IEmulationProfile<T>, config?: IBrowserEmulatorConfig);
    configure(emulationProfile: IEmulationProfile<T>): void;
    onDnsConfiguration(settings: IDnsSettings): void;
    onTcpConfiguration(settings: ITcpSettings): void;
    onTlsConfiguration(settings: ITlsSettings): void;
    beforeHttpRequest(resource: IHttpResourceLoadDetails): void;
    onHttpAgentInitialized(agent: IHttpSocketAgent): Promise<void>;
    onHttp2SessionConnect(request: IHttpResourceLoadDetails, settings: IHttp2ConnectSettings): void;
    onNewBrowser(browser: IBrowser, options: IBrowserUserConfig): void;
    addDomOverride(runOn: 'page' | 'worker', script: string, args: Record<string, any> & {
        callbackName?: string;
    }, callback?: (data: string, frame: IFrame) => any): boolean;
    onClose(): void;
    onNewPage(page: IPage): Promise<any>;
    onNewFrameProcess(frame: IFrame): Promise<any>;
    onNewWorker(worker: IWorker): Promise<any>;
    protected getUserAgentData(): IUserAgentData;
    static shouldActivate(emulationProfile: IEmulationProfile<IEmulatorOptions>): boolean;
    static selectBrowserMeta(userAgentSelector?: string): {
        browserEngine: IBrowserEngine;
        userAgentOption: IUserAgentOption;
    };
    static getBrowserEngine(userAgentOption: IUserAgentOption): IBrowserEngine;
    static default(): IBrowserEngine;
}
