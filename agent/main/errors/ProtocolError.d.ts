export default class ProtocolError extends Error {
    remoteError: {
        message: string;
        data: any;
        code?: number;
    };
    method: string;
    constructor(stack: string, method: string, remoteError: {
        message: string;
        data: any;
        code?: number;
    });
}
