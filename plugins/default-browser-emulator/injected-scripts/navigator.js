"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedArgs = args;
if (typedArgs.userAgentString) {
    replaceGetter(self.navigator, 'userAgent', () => typedArgs.userAgentString, {
        onlyForInstance: true,
    });
    replaceGetter(self.navigator, 'appVersion', () => typedArgs.userAgentString.replace('Mozilla/', ''), { onlyForInstance: true });
}
if ('NetworkInformation' in self) {
    replaceGetter(self.NetworkInformation.prototype, 'rtt', () => typedArgs.rtt);
}
if (typedArgs.userAgentData && 'userAgentData' in self.navigator) {
    const userAgentData = self.navigator.userAgentData;
    function checkThisArg(thisArg, customMessage = '') {
        if (ObjectCached.getPrototypeOf(thisArg) !==
            self.NavigatorUAData.prototype) {
            throw new TypeError(`${customMessage}Illegal invocation`);
        }
    }
    replaceGetter(userAgentData, 'brands', (_, thisArg) => {
        checkThisArg(thisArg);
        const clonedValues = typedArgs.userAgentData.brands.map(x => ({ ...x }));
        return ObjectCached.seal(ObjectCached.freeze(clonedValues));
    });
    replaceGetter(userAgentData, 'platform', (_, thisArg) => {
        checkThisArg(thisArg);
        return typedArgs.userAgentData.platform;
    });
    replaceFunction(userAgentData, 'getHighEntropyValues', async (target, thisArg, argArray) => {
        checkThisArg(thisArg, "Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': ");
        await ReflectCached.apply(target, thisArg, argArray);
        const props = {
            brands: ObjectCached.seal(ObjectCached.freeze(typedArgs.userAgentData.brands)),
            mobile: false,
        };
        if (argArray.length && Array.isArray(argArray[0])) {
            for (const key of argArray[0]) {
                if (key in typedArgs.userAgentData) {
                    props[key] = typedArgs.userAgentData[key];
                }
            }
        }
        return Promise.resolve(props);
    });
}
if (typedArgs.pdfViewerEnabled && 'pdfViewerEnabled' in self.navigator) {
    replaceGetter(self.navigator, 'pdfViewerEnabled', () => typedArgs.pdfViewerEnabled, {
        onlyForInstance: true,
    });
}
replaceGetter(self.navigator, 'platform', () => typedArgs.platform, {
    onlyForInstance: true,
});
