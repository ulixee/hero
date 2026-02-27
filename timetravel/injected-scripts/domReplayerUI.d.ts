declare global {
    interface Window {
        showReplayStatus(text: string): any;
        overlay(options?: {
            notify?: string;
            hide?: boolean;
        }): any;
        reattachUI(): any;
    }
}
export {};
