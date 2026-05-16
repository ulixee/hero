export default class RemoteError extends Error {
    private readonly type;
    private readonly code;
    private readonly description;
    private readonly data;
    constructor(error: Partial<Error> & {
        type?: string;
        code?: string;
        description?: string;
        data?: any;
    });
    toString(): string;
}
