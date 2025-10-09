export type IAsyncFunc = (...args: any) => Promise<any> | any;
type IPromiseType<T> = T extends PromiseLike<infer U> ? U : T;
type RestParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : [];
type IApiHandlers = {
    [api: string]: IAsyncFunc;
};
export default IApiHandlers;
type IApi<T extends IAsyncFunc> = {
    args: RestParameters<T>;
    result: IPromiseType<ReturnType<T>>;
};
export type IApiSchema = {
    [command: string]: {
        args: any;
        result: any;
    };
};
export type IApiSpec<Handlers extends IApiHandlers> = {
    [key in keyof Handlers]: IApi<Handlers[key]>;
};
