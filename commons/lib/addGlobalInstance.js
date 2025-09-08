"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addGlobalInstance;
function addGlobalInstance(...constructors) {
    for (const constructor of constructors) {
        if (!constructor.prototype)
            continue;
        const instanceSymbol = Symbol.for(`@ulixee/${constructor.name}`);
        if (constructor.prototype[instanceSymbol] === true)
            continue;
        constructor.prototype[instanceSymbol] = true;
        Object.defineProperty(constructor, Symbol.hasInstance, {
            value: function hasInstance(candidate) {
                return this === constructor && !!candidate?.[instanceSymbol];
            },
        });
    }
}
//# sourceMappingURL=addGlobalInstance.js.map