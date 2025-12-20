import IMitmRequestContext from '../interfaces/IMitmRequestContext';
export default class InterceptorHandler {
    static shouldIntercept(ctx: IMitmRequestContext): Promise<boolean>;
}
