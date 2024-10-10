"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedArgs = args;
if (typedArgs.preventDefaultUncaughtError) {
    self.addEventListener('error', preventDefault);
}
if (typedArgs.preventDefaultUnhandledRejection) {
    self.addEventListener('unhandledrejection', preventDefault);
}
function preventDefault(event) {
    let prevented = event.defaultPrevented;
    event.preventDefault();
    replaceFunction(event, 'preventDefault', (target, thisArg, argArray) => {
        ReflectCached.apply(target, thisArg, argArray);
        prevented = true;
    }, { onlyForInstance: true });
    replaceGetter(event, 'defaultPrevented', (target, thisArg, argArray) => {
        ReflectCached.apply(target, thisArg, argArray);
        return prevented;
    }, { onlyForInstance: true });
    if (!('console' in self)) {
        return;
    }
    const error = event instanceof ErrorEvent ? event.error : event.reason;
    self.console.error(`Default ${event.type} event prevented, error:`, error);
}
