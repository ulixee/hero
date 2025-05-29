"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const source_map_js_1 = require("source-map-js");
const fs = require("fs");
const path = require("path");
const SourceMapSupport_1 = require("../lib/SourceMapSupport");
const SourceLoader_1 = require("../lib/SourceLoader");
let counter = 0;
beforeEach(() => {
    jest.resetModules();
    SourceMapSupport_1.SourceMapSupport.resetCache();
    SourceLoader_1.default.resetCache();
    counter += 1;
});
it('normal throw', () => {
    const { full, inline } = createStackTraces(createMultiLineSourceMap(), [
        'throw new Error("test");',
    ]);
    for (const stack of [full, inline]) {
        expect(stack[0]).toBe('Error: test');
        expect(stack[1]).toMatch(/^ {4}at Object\.<anonymous>\.exports\.test \((?:.*[/\\])?line1\.js:1001:101\)$/);
    }
});
it('throw inside function', () => {
    const { full, inline } = createStackTraces(createMultiLineSourceMap(), [
        'function foo() {',
        '  throw new Error("test");',
        '}',
        'foo();',
    ]);
    for (const stack of [full, inline]) {
        expect(stack[0]).toBe('Error: test');
        expect(stack[1]).toMatch(/^ {4}at foo \((?:.*[/\\])?line2\.js:1002:102\)$/);
        expect(stack[2]).toMatch(/^ {4}at Object\.<anonymous>\.exports\.test \((?:.*[/\\])?line4\.js:1004:104\)$/);
    }
});
it('throw inside function inside function', () => {
    const { full, inline } = createStackTraces(createMultiLineSourceMap(), [
        'function foo() {',
        '  function bar() {',
        '    throw new Error("test");',
        '  }',
        '  bar();',
        '}',
        'foo();',
    ]);
    for (const stack of [full, inline]) {
        expect(stack[0]).toBe('Error: test');
        expect(stack[1]).toMatch(/^ {4}at bar \((?:.*[/\\])?line3\.js:1003:103\)$/);
        expect(stack[2]).toMatch(/^ {4}at foo \((?:.*[/\\])?line5\.js:1005:105\)$/);
        expect(stack[3]).toMatch(/^ {4}at Object\.<anonymous>\.exports\.test \((?:.*[/\\])?line7\.js:1007:107\)$/);
    }
});
it('native function', () => {
    const sourceMap = createEmptySourceMap();
    sourceMap.addMapping({
        generated: { line: 1, column: 0 },
        original: { line: 1, column: 0 },
        source: '.original.js',
    });
    const { full, inline } = createStackTraces(sourceMap, [
        '[1].map(function(x) { throw new Error(x); });',
    ]);
    for (const stack of [full, inline]) {
        expect(stack[0]).toBe('Error: 1');
        expect(stack[1]).toMatch(/\.original\.js/);
        expect(stack[2]).toMatch(/at Array\.map \((native|<anonymous>)\)/);
    }
});
it('function constructor', () => {
    const { full, inline } = createStackTraces(createMultiLineSourceMap(), [
        'throw new Function(")");',
    ]);
    for (const stack of [full, inline]) {
        expect(stack[0]).toMatch(/SyntaxError: Unexpected token '?\)'?/);
    }
});
it('throw with empty source map', () => {
    const { full, inline } = createStackTraces(createEmptySourceMap(), ['throw new Error("test");']);
    for (const stack of [full, inline]) {
        expect(stack[0]).toBe('Error: test');
        expect(stack[1]).toMatch(/^ {4}at Object\.<anonymous>\.exports\.test \((?:.*[/\\])?\.generated-\d+(?:-inline)?\.js:1:\d+\)$/);
    }
});
it('throw with source map with gap', () => {
    const { full, inline } = createStackTraces(createSourceMapWithGap(), [
        'throw new Error("test");',
    ]);
    for (const stack of [full, inline]) {
        expect(stack[0]).toBe('Error: test');
        expect(stack[1]).toMatch(/^ {4}at Object\.<anonymous>\.exports\.test \((?:.*[/\\])?\.generated-\d+(?:-inline)?\.js:1:\d+\)$/);
    }
});
it('finds the last sourceMappingURL', () => {
    const { full, inline } = createStackTraces(createMultiLineSourceMapWithSourcesContent(), [
        '//# sourceMappingURL=missing.map.js', // NB: createStackTraces adds another source mapping.
        'throw new Error("test");',
    ]);
    for (const stack of [full, inline]) {
        expect(stack[0]).toBe('Error: test');
        expect(stack[1]).toMatch(/^ {4}at Object\.<anonymous>\.exports\.test \((?:.*[/\\])?original\.js:1002:5\)$/);
    }
});
it('maps original name from source', () => {
    const sourceMap = createEmptySourceMap();
    sourceMap.addMapping({
        generated: { line: 2, column: 8 },
        original: { line: 1000, column: 10 },
        source: '.original2.js',
    });
    sourceMap.addMapping({
        generated: { line: 4, column: 0 },
        original: { line: 1002, column: 1 },
        source: '.original2.js',
        name: 'myOriginalName',
    });
    const { full, inline } = createStackTraces(sourceMap, [
        'function foo() {',
        '  throw new Error("test");',
        '}',
        'foo();',
    ]);
    for (const stack of [full, inline]) {
        expect(stack[0]).toBe('Error: test');
        expect(stack[1]).toMatch(/^ {4}at myOriginalName \((?:.*[/\\])?\.original2.js:1000:11\)$/);
        expect(stack[2]).toMatch(/^ {4}at Object\.<anonymous>\.exports\.test \((?:.*[/\\])?\.original2.js:1002:2\)$/);
    }
});
/* The following test duplicates some of the code in
 * `createStackTraces` but appends a charset to the
 * source mapping url.
 */
it('finds source maps with charset specified', () => {
    const sourceMap = createMultiLineSourceMap();
    const file = `./.generated-${counter}.js`;
    fs.writeFileSync(path.join(__dirname, file), `${'exports.test = function() {' +
        'throw new Error("test");' +
        '};//@ sourceMappingURL=data:application/json;charset=utf8;base64,'}${Buffer.from(sourceMap.toString()).toString('base64')}`);
    try {
        // eslint-disable-next-line import/no-dynamic-require
        require(file).test();
    }
    catch (e) {
        const stack = e.stack.split(/\r\n|\n/);
        expect(stack[0]).toBe('Error: test');
        expect(stack[1]).toMatch(/^ {4}at Object\.<anonymous>\.exports\.test \((?:.*[/\\])?line1\.js:1001:101\)$/);
    }
    fs.unlinkSync(path.join(__dirname, file));
});
/* The following test duplicates some of the code in
 * `createStackTraces` but appends some code and a
 * comment to the source mapping url.
 */
it('allows code/comments after sourceMappingURL', () => {
    const sourceMap = createMultiLineSourceMap();
    const file = `./.generated-${counter}.js`;
    fs.writeFileSync(path.join(__dirname, file), `${'exports.test = function() {' +
        'throw new Error("test");' +
        '};//# sourceMappingURL=data:application/json;base64,'}${Buffer.from(sourceMap.toString()).toString('base64')}\n// Some comment below the sourceMappingURL\nvar foo = 0;`);
    try {
        // eslint-disable-next-line import/no-dynamic-require
        require(file).test();
    }
    catch (e) {
        const stack = e.stack.split(/\r\n|\n/);
        expect(stack[0]).toBe('Error: test');
        expect(stack[1]).toMatch(/^ {4}at Object\.<anonymous>\.exports\.test \((?:.*[/\\])?line1\.js:1001:101\)$/);
    }
    fs.unlinkSync(path.join(__dirname, file));
});
function createEmptySourceMap() {
    return new source_map_js_1.SourceMapGenerator({
        file: `.generated-${counter}.js`,
        sourceRoot: '.',
    });
}
function createSourceMapWithGap() {
    const sourceMap = createEmptySourceMap();
    sourceMap.addMapping({
        generated: { line: 100, column: 0 },
        original: { line: 100, column: 0 },
        source: '.original.js',
    });
    return sourceMap;
}
function createMultiLineSourceMap() {
    const sourceMap = createEmptySourceMap();
    for (let i = 1; i <= 100; i++) {
        sourceMap.addMapping({
            generated: { line: i, column: 0 },
            original: { line: 1000 + i, column: 99 + i },
            source: `line${i}.js`,
        });
    }
    return sourceMap;
}
function createMultiLineSourceMapWithSourcesContent() {
    const sourceMap = createEmptySourceMap();
    let original = new Array(1001).join('\n');
    for (let i = 1; i <= 100; i++) {
        sourceMap.addMapping({
            generated: { line: i, column: 0 },
            original: { line: 1000 + i, column: 4 },
            source: 'original.js',
        });
        original += `    line ${i}\n`;
    }
    sourceMap.setSourceContent('original.js', original);
    return sourceMap;
}
function createStackTraces(sourceMap, source) {
    // Check once with a separate source map
    fs.writeFileSync(`${__dirname}/.generated-${counter}.js.map`, sourceMap.toString());
    fs.writeFileSync(`${__dirname}/.generated-${counter}.js`, `exports.test = function() {${source.join('\n')}};//@ sourceMappingURL=.generated-${counter}.js.map`);
    const response = { full: null, inline: null };
    try {
        // eslint-disable-next-line import/no-dynamic-require
        require(`./.generated-${counter}`).test();
    }
    catch (e) {
        response.full = e.stack.split(/\r\n|\n/);
    }
    fs.unlinkSync(`${__dirname}/.generated-${counter}.js`);
    fs.unlinkSync(`${__dirname}/.generated-${counter}.js.map`);
    // Check again with an inline source map (in a data URL)
    fs.writeFileSync(`${__dirname}/.generated-${counter}-inline.js`, `exports.test = function() {${source.join('\n')}};//@ sourceMappingURL=data:application/json;base64,${Buffer.from(sourceMap.toString()).toString('base64')}`);
    try {
        // eslint-disable-next-line import/no-dynamic-require
        require(`./.generated-${counter}-inline`).test();
    }
    catch (e) {
        response.inline = e.stack.split(/\r\n|\n/);
    }
    fs.unlinkSync(`${__dirname}/.generated-${counter}-inline.js`);
    return response;
}
//# sourceMappingURL=SourceMapSupport.test.js.map