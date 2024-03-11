"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Path = require("path");
const json2md = require("json2md");
const decamelize = require("decamelize");
const rawDocs = require("@ulixee/awaited-dom/docs.json");
const noderdom_detached_1 = require("noderdom-detached");
const docs = rawDocs;
const domParser = new noderdom_detached_1.DOMParser();
const docUrls = new Map();
for (const doc of docs) {
    doc.title = doc.name;
    let slug = doc.name.replace('IFrame', 'Iframe').replace('XPath', 'Xpath');
    if (slug.startsWith('HTML'))
        slug = `html-${slug.slice(4)}`;
    doc.slug = decamelize(slug, '-');
    docUrls.set(doc.title, `${doc.slug}.md`);
}
json2md.converters.html = input => input;
const awaitedDomDir = Path.resolve(__dirname, '../awaited-dom');
const docsDir = Path.resolve(__dirname, '..');
const awaitedDOMBasePath = Path.join(docsDir, 'basic-client', 'awaited-dom.base.md');
const awaitedDOMIndexPath1 = Path.join(docsDir, 'basic-client', 'awaited-dom.md');
const awaitedDOMIndexPath2 = Path.join(awaitedDomDir, 'index.md');
const docsByTag = {};
docs.forEach((doc) => {
    const filepath = Path.join(awaitedDomDir, `${doc.slug}.md`);
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
        return [doc.title, `../awaited-dom/${doc.slug}.md`];
    });
    const markup = [{ table: linksTable }];
    const markdown = json2md(markup);
    awaitedDOMBase = awaitedDOMBase.replace(placementToken, markdown);
});
Fs.writeFileSync(awaitedDOMIndexPath1, awaitedDOMBase);
Fs.writeFileSync(awaitedDOMIndexPath2, awaitedDOMBase
    .replace(/\.\.\/awaited-dom\//g, './')
    .replace('./awaited-dom-extensions.md', '../basic-client/awaited-dom-extensions.md'));
// SAVE DOC
function saveDoc(doc, filePath) {
    const markup = [
        { h1: `[AwaitedDOM](../basic-client/awaited-dom) <span>/</span> ${doc.title}` },
    ];
    const variableName = doc.variableName || '';
    JSON.parse(doc.overview || '[]').forEach((overview) => {
        markup.push({ html: `<div class='overview'>${cleanupHTML(overview)}</div>` });
    });
    if (doc.tags.includes('Super') && doc.dependencies.length) {
        markup.push({ h2: 'Dependencies' });
        markup.push({
            p: `${doc.title} implements all the properties and methods of the following classes:`,
        });
        const linksTable = extractLinksTable(doc.dependencies, dep => {
            const url = docUrls.get(dep.name);
            return [dep.name, url ? `./${url}` : undefined];
        });
        markup.push({ table: linksTable });
    }
    if (doc.title === 'XPathResult') {
        for (const p of doc.properties) {
            if (p.name === 'singleNodeValue') {
                const example = '\n\n ```js' +
                    '\n  await result.singleNodeResult === null; // null if not present' +
                    '\n  await result.singleNodeResult.textContent; // gets text' +
                    '\n ```';
                p.overview += `\n\n\nNOTE: The returned SuperNode will behave like all AwaitedDOM SuperNodes: nothing will be retrieved until you await the node or child property.
${example}
`;
            }
        }
        for (const m of doc.methods) {
            if (m.name === 'iterateNext') {
                const example = '\n\n ```js' +
                    '\n  await result.iterateNext() === null; // null if not present' +
                    '\n  await result.iterateNext().textContent; // gets text' +
                    '\n ```';
                m.overview += `\n\n\nNOTE: The iterated SuperNodes will behave like all AwaitedDOM SuperNodes: nothing will be retrieved until you await the node or child property.
${example}
`;
            }
        }
    }
    const implementedProperties = doc.properties.filter(x => x.isImplemented);
    if (implementedProperties.length) {
        markup.push({ h2: 'Properties' });
        for (const p of implementedProperties) {
            markup.push({
                h3: `${variableName}.${p.name} <div class="specs"><i>W3C</i></div> {#${p.name}}`,
            });
            // Cleanup writeable Dom for now!
            markup.push({
                html: cleanupHTML(p.overview || 'Needs content.').replace('Returns / Sets', 'Returns'),
            });
            markup.push({ h4: `**Type**: ${urlify(p.returnType)}` });
        }
    }
    const implementedMethods = doc.methods.filter(x => x.isImplemented);
    if (implementedMethods.length) {
        markup.push({ h2: 'Methods' });
        for (const m of implementedMethods) {
            const args = m.parameters
                .map((x) => {
                let name = x.name;
                if (x.isVariadic)
                    name = `...${name}`;
                else if (x.isOptional)
                    name += '?';
                return name;
            })
                .join(', ');
            markup.push({
                h3: `${variableName}.${m.name} *(${args})* <div class="specs"><i>W3C</i></div> {#${m.name}}`,
            });
            markup.push({ html: cleanupHTML(m.overview || 'Needs content.') });
            if (m.parameters.length) {
                markup.push({ h4: `**Arguments**:` });
                const paramList = [];
                markup.push({ ul: paramList });
                for (const param of m.parameters) {
                    const name = `${param.name} ${urlify(param.type)}`;
                    if (param.overview?.startsWith('<ul')) {
                        const details = getParameterList(param.overview || 'Needs content.');
                        paramList.push(name, { ul: details });
                    }
                    else {
                        const details = cleanupHTML(param.overview || 'Needs content.');
                        paramList.push(`${name}. ${details}`);
                    }
                }
            }
            markup.push({ h4: `**Returns**: ${urlify(m.returnType)}` });
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
        if (unimplementedProperties.length) {
            markup.push({ h4: 'Properties' });
            const rows = [];
            for (let i = 0; i < unimplementedProperties.length; i += 2) {
                rows.push([
                    asCode(unimplementedProperties[i]?.name),
                    asCode(unimplementedProperties[i + 1]?.name),
                ]);
            }
            markup.push({
                table: { headers: [' ', ' '], rows },
            });
        }
        if (unimplementedMethods.length) {
            markup.push({ h4: 'Methods' });
            const rows = [];
            for (let i = 0; i < unimplementedMethods.length; i += 2) {
                rows.push([
                    asCode(unimplementedMethods[i]?.name, true),
                    asCode(unimplementedMethods[i + 1]?.name, true),
                ]);
            }
            markup.push({
                table: { headers: [' ', ' '], rows },
            });
        }
    }
    const markdown = json2md(markup);
    Fs.writeFileSync(filePath, markdown);
    console.log(`Saved ${filePath}`);
}
function asCode(code, appendMethodSignature = false) {
    if (code) {
        if (appendMethodSignature)
            return `\`${code}()\``;
        return `\`${code}\``;
    }
    return '';
}
function urlify(type) {
    // we don't list "isolates" in our docs
    type = type.replace('Isolate', '');
    const url = docUrls.get(type) ??
        docUrls.get(`Promise<${type}>`) ??
        docUrls.get(`Promise<${type}[]>`) ??
        docUrls.get(`${type}[]`);
    if (url) {
        return `[\`${type}\`](./${url})`;
    }
    return `\`${type}\``;
}
function getParameterList(html) {
    html = cleanupHTML(html);
    const document = domParser.parseFromString(html, 'text/html');
    const children = [];
    const firstList = document.querySelector('ul');
    if (!firstList)
        return html;
    for (const child of firstList.children) {
        children.push(child.innerHTML.trim());
    }
    return children;
}
function cleanupHTML(html) {
    const document = domParser.parseFromString(html, 'text/html');
    for (const a of document.querySelectorAll('a')) {
        const link = a;
        const outer = link.outerHTML;
        const href = link.getAttribute('href');
        const body = link.innerHTML;
        const text = link.textContent;
        if (text === 'DOMString' || text === 'USVString')
            html = html.replace(outer, '`string`');
        else if (text === 'Boolean')
            html = html.replace(outer, '`boolean`');
        else if (text === 'Number')
            html = html.replace(outer, '`number`');
        else if (href?.startsWith('/')) {
            if (href.includes('Document_object_model/Locating_DOM_elements_using_selectors')) {
                link.setAttribute('target', 'mdnrel');
                link.setAttribute('href', `https://developer.mozilla.org${href}`);
                html = html.replace(outer, link.outerHTML);
            }
            else {
                html = html.replace(outer, body);
            }
        }
    }
    for (const tb of document.querySelectorAll('table')) {
        const table = tb;
        const outer = table.outerHTML;
        html = html.replace(outer, `
<code class="language-html">
    ${outer}
</code>

`);
    }
    html = html.replace(/[\n\t]`+/g, '`');
    return html.replace(/\n\n/g, '\n');
}
function extractLinksTable(records, extractLinkFn) {
    const cells = [];
    records.forEach(record => {
        const [linkName, linkHref] = extractLinkFn(record);
        if (linkHref)
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
//# sourceMappingURL=generateAwaitedDOM.js.map