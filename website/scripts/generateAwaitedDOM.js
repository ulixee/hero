#!/usr/bin/env ts-node
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = __importStar(require("fs"));
const Path = __importStar(require("path"));
const json2md_1 = __importDefault(require("json2md"));
const decamelize_1 = __importDefault(require("decamelize"));
const docs_json_1 = __importDefault(require("awaited-dom/docs.json"));
const docs = docs_json_1.default;
json2md_1.default.converters.html = input => input;
const awaitedDomDir = Path.resolve(__dirname, '../awaited-dom');
const docsDir = Path.resolve(__dirname, '../docs');
const awaitedDOMBasePath = Path.join(docsDir, 'BasicInterfaces', 'AwaitedDOM.base.md');
const awaitedDOMIndexPath1 = Path.join(docsDir, 'BasicInterfaces', 'AwaitedDOM.md');
const awaitedDOMIndexPath2 = Path.join(awaitedDomDir, 'index.md');
const docsByTag = {};
docs.forEach((doc) => {
    const filepath = Path.join(awaitedDomDir, `${doc.name}.md`);
    const tags = doc.tags.split(',').filter(t => t);
    tags.forEach(tag => {
        docsByTag[tag] = docsByTag[tag] || [];
        docsByTag[tag].push(doc);
    });
    saveDoc(doc, filepath);
});
let awaitedDOMBase = Fs.readFileSync(awaitedDOMBasePath, 'utf-8');
Object.keys(docsByTag).forEach(tag => {
    const placementToken = `[INTERFACES:${tag}]`;
    if (!awaitedDOMBase.includes(placementToken))
        return;
    const linksTable = extractLinksTable(docsByTag[tag], (doc) => {
        return [doc.name, `/docs/awaited-dom/${decamelize_1.default(doc.name, '-')}`];
    });
    const markup = [{ table: linksTable }];
    const markdown = json2md_1.default(markup);
    awaitedDOMBase = awaitedDOMBase.replace(placementToken, markdown);
});
Fs.writeFileSync(awaitedDOMIndexPath1, awaitedDOMBase);
Fs.writeFileSync(awaitedDOMIndexPath2, awaitedDOMBase);
// SAVE DOC
function saveDoc(doc, filePath) {
    const markup = [
        { h1: `[AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> ${doc.name}` },
    ];
    const variableName = doc.variableName || '';
    JSON.parse(doc.overview || '[]').forEach((overview) => {
        markup.push({ html: `<div class='overview'>${overview}</div>` });
    });
    if (doc.tags.includes('Super') && doc.dependencies.length) {
        markup.push({ h2: 'Dependencies' });
        markup.push({
            p: `${doc.name} implements all the properties and methods of the following classes:`,
        });
        const linksTable = extractLinksTable(doc.dependencies, (dep) => {
            return [dep.name, `./${decamelize_1.default(dep.name, '-')}`];
        });
        markup.push({ table: linksTable });
    }
    const implementedProperties = doc.properties.filter(x => x.isImplemented);
    if (implementedProperties.length) {
        markup.push({ h2: 'Properties' });
        for (const p of implementedProperties) {
            markup.push({
                h3: `${variableName}.${p.name} <div class="specs"><i>W3C</i></div> {#${p.name}}`,
            });
            markup.push({ html: cleanupHTML(p.overview || 'Needs content.') });
            markup.push({ h4: `**Type**: \`${p.returnType}\`` });
        }
    }
    const implementedMethods = doc.methods.filter(x => x.isImplemented);
    if (implementedMethods.length) {
        markup.push({ h2: 'Methods' });
        for (const m of implementedMethods) {
            markup.push({
                h3: `${variableName}.${m.name}*(...args)* <div class="specs"><i>W3C</i></div> {#${m.name}}`,
            });
            markup.push({ html: cleanupHTML(m.overview || 'Needs content.') });
            markup.push({ h4: `**Arguments**:` });
            markup.push({ ul: ['none'] });
            markup.push({ h4: `**Returns**: \`Promise<void>\`` });
        }
    }
    if (doc.events) {
        markup.push({ h2: 'Events' });
    }
    const unimplementedProperties = doc.properties.filter(x => !x.isImplemented);
    const unimplementedMethods = doc.methods.filter(x => !x.isImplemented);
    const hasUnimplementedSpecs = unimplementedProperties.length || unimplementedMethods.length;
    if (!doc.tags.includes('Super') && hasUnimplementedSpecs) {
        markup.push({ h2: 'Unimplemented Specs' });
        markup.push({
            p: `This class has ${unimplementedProperties.length} unimplemented ${unimplementedProperties.length === 1 ? 'property' : 'properties'} and ${unimplementedMethods.length} unimplemented ${unimplementedMethods.length === 1 ? 'method' : 'methods'}.`,
        });
    }
    const markdown = json2md_1.default(markup);
    Fs.writeFileSync(filePath, markdown);
    console.log(`Saved ${filePath}`);
}
function cleanupHTML(html) {
    html = html.replace(/^([^\n]+)</, '$1\n<');
    return html.replace(/\n\n/g, '\n');
}
function extractLinksTable(records, extractLinkFn) {
    const cells = [];
    records.forEach(record => {
        const [linkName, linkHref] = extractLinkFn(record);
        cells.push(`[${linkName}](${linkHref})`);
    });
    const rows = [];
    while (cells.length) {
        const row = cells.splice(0, 2);
        if (row.length < 2)
            row.push('');
        rows.push(row);
    }
    return { headers: [' ', ' '], rows };
}
