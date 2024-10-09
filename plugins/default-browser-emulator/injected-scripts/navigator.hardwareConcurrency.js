"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedArgs = args;
replaceGetter(self.navigator, 'hardwareConcurrency', () => typedArgs.concurrency, {
    onlyForInstance: true,
});
