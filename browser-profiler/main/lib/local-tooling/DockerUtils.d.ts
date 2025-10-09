import { ChildProcess } from 'child_process';
export declare function buildChromeDocker(version: string, chromeUrl: string): string;
export declare function getDockerHost(): string;
export declare function startDockerAndLoadUrl(dockerName: string, dockerHost: string, url: string, automationType: string, needsLocalHost: boolean, chromeVersion: number): Promise<ChildProcess>;
export declare function stopDocker(dockerName: string): void;
