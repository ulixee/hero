"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CookieStorage_coreFrame;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCookieStorage = createCookieStorage;
class CookieStorage {
    constructor(coreFrame) {
        _CookieStorage_coreFrame.set(this, void 0);
        __classPrivateFieldSet(this, _CookieStorage_coreFrame, coreFrame, "f");
    }
    get length() {
        return this.getItems().then(x => x.length);
    }
    async getItems() {
        const coreFrame = await __classPrivateFieldGet(this, _CookieStorage_coreFrame, "f");
        return await coreFrame.getCookies();
    }
    async key(index) {
        const cookies = await this.getItems();
        return cookies[index]?.name;
    }
    async clear() {
        const coreFrame = await __classPrivateFieldGet(this, _CookieStorage_coreFrame, "f");
        const cookies = await this.getItems();
        for (const cookie of cookies) {
            await coreFrame.removeCookie(cookie.name);
        }
    }
    async getItem(key) {
        const cookies = await this.getItems();
        return cookies?.find(x => x.name === key);
    }
    async setItem(key, value, options) {
        const coreFrame = await __classPrivateFieldGet(this, _CookieStorage_coreFrame, "f");
        return coreFrame.setCookie(key, value, options);
    }
    async removeItem(name) {
        const coreFrame = await __classPrivateFieldGet(this, _CookieStorage_coreFrame, "f");
        return coreFrame.removeCookie(name);
    }
}
_CookieStorage_coreFrame = new WeakMap();
exports.default = CookieStorage;
function createCookieStorage(coreFrame) {
    return new CookieStorage(coreFrame);
}
//# sourceMappingURL=CookieStorage.js.map