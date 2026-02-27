export default interface IApiHandler {
    readonly command: string;
    handler(args: any, options?: any): Promise<any>;
}
