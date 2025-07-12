import * as http from 'http';
export default function downloadFile(url: string, destinationPath: string, progressCallback?: (downloadedBytes: number, totalBytes: number) => void): Promise<void>;
export declare function httpGet(url: string, response: (x: http.IncomingMessage) => void): http.ClientRequest;
