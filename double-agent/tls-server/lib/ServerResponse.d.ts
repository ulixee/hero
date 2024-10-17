import { IncomingHttpHeaders } from 'http';
export default class ServerResponse {
    private readonly child;
    private readonly connectionId;
    constructor(child: any, { connectionId }: {
        connectionId: string;
    });
    writeHead(status: number, headers: IncomingHttpHeaders): void;
    end(body?: string): void;
}
