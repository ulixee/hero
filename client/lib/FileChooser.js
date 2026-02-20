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
var _FileChooser_jsPath, _FileChooser_coreFrame;
Object.defineProperty(exports, "__esModule", { value: true });
const AwaitedPath_1 = require("@ulixee/awaited-dom/base/AwaitedPath");
const create_1 = require("@ulixee/awaited-dom/impl/create");
class FileChooser {
    constructor(coreFrame, event) {
        _FileChooser_jsPath.set(this, void 0);
        _FileChooser_coreFrame.set(this, void 0);
        const awaitedPath = new AwaitedPath_1.default(null, ...event.jsPath);
        this.inputElement = (0, create_1.createHTMLInputElement)(awaitedPath, { coreFrame });
        this.acceptsMultipleFiles = event.selectMultiple;
        __classPrivateFieldSet(this, _FileChooser_jsPath, event.jsPath, "f");
        __classPrivateFieldSet(this, _FileChooser_coreFrame, coreFrame, "f");
    }
    async chooseFiles(...files) {
        if (!files.length)
            throw new Error(`No files were provided to send to this input`);
        if (files.length > 1 && !this.acceptsMultipleFiles) {
            throw new Error(`This input only supports a single file input, but ${files.length} files were supplied`);
        }
        const frame = await __classPrivateFieldGet(this, _FileChooser_coreFrame, "f");
        const finalFiles = [];
        for (const file of files) {
            finalFiles.push(file);
        }
        await frame.setFileInputFiles(__classPrivateFieldGet(this, _FileChooser_jsPath, "f"), finalFiles);
    }
}
_FileChooser_jsPath = new WeakMap(), _FileChooser_coreFrame = new WeakMap();
exports.default = FileChooser;
//# sourceMappingURL=FileChooser.js.map