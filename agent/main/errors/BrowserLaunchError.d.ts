export default class BrowserLaunchError extends Error {
    isSandboxError: boolean;
    constructor(message: string, stack: string, isSandboxError?: boolean);
}
