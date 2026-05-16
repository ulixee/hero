"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Callsite_1 = require("../lib/Callsite");
const SourceLoader_1 = require("../lib/SourceLoader");
it('can lookup source code', () => {
    let callsite;
    // run code like this so we can see the true load (?? will be translated by typescript)
    function loadCallsite() {
        callsite ??= Callsite_1.default.getSourceCodeLocation();
        return callsite;
    }
    const site = loadCallsite();
    expect(SourceLoader_1.default.getSource(site[0]).code).toBe(`    callsite ??= Callsite.getSourceCodeLocation();`);
    expect(SourceLoader_1.default.getSource(site[1]).code).toBe(`  const site = loadCallsite();`);
});
//# sourceMappingURL=SourceLoader.test.js.map