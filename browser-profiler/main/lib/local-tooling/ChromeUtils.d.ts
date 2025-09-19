export declare function getChromeDownloadUrlForLinux(fullVersion: string): string;
export declare function startChromeAndLoadUrl(executablePath: string, url: string, headType: string, automationType: string, majorVersion: number): Promise<void>;
export declare function stopChrome(): Promise<void>;
export declare function getChromeExecutablePath(fullVersion: string): string;
export declare function installChrome(fullVersion: string): Promise<void>;
export declare function navigateDevtoolsToUrl(url: string, developerToolsPort: number): Promise<void>;
