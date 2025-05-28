"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { replaceGetter, ObjectCached, replaceFunction, ReflectCached }, }) {
    if (args.userAgentString) {
        replaceGetter(self.navigator, 'userAgent', () => args.userAgentString, {
            onlyForInstance: true,
        });
        replaceGetter(self.navigator, 'appVersion', () => args.userAgentString.replace('Mozilla/', ''), { onlyForInstance: true });
    }
    if ('NetworkInformation' in self) {
        replaceGetter(self.NetworkInformation.prototype, 'rtt', () => args.rtt);
    }
    if (args.userAgentData && 'userAgentData' in self.navigator) {
        const userAgentData = self.navigator.userAgentData;
        function checkThisArg(thisArg, customMessage = '') {
            if (ObjectCached.getPrototypeOf(thisArg) !== self.NavigatorUAData.prototype) {
                throw new TypeError(`${customMessage}Illegal invocation`);
            }
        }
        replaceGetter(userAgentData, 'brands', (_, thisArg) => {
            checkThisArg(thisArg);
            const clonedValues = args.userAgentData.brands.map(x => ({ ...x }));
            return ObjectCached.seal(ObjectCached.freeze(clonedValues));
        });
        replaceGetter(userAgentData, 'platform', (_, thisArg) => {
            checkThisArg(thisArg);
            return args.userAgentData.platform;
        });
        replaceFunction(userAgentData, 'getHighEntropyValues', async (target, thisArg, argArray) => {
            checkThisArg(thisArg, "Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': ");
            await ReflectCached.apply(target, thisArg, argArray);
            const props = {
                brands: ObjectCached.seal(ObjectCached.freeze(args.userAgentData.brands)),
                mobile: false,
            };
            if (argArray.length && Array.isArray(argArray[0])) {
                for (const key of argArray[0]) {
                    if (key in args.userAgentData) {
                        props[key] = args.userAgentData[key];
                    }
                }
            }
            return Promise.resolve(props);
        });
    }
    if (args.pdfViewerEnabled && 'pdfViewerEnabled' in self.navigator) {
        replaceGetter(self.navigator, 'pdfViewerEnabled', () => args.pdfViewerEnabled, {
            onlyForInstance: true,
        });
    }
    replaceGetter(self.navigator, 'platform', () => args.platform, {
        onlyForInstance: true,
    });
}
