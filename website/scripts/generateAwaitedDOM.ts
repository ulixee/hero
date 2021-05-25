#!/usr/bin/env ts-node

import * as Fs from 'fs';
import * as Path from 'path';
import json2md from 'json2md';
import decamelize from 'decamelize';
import rawDocs from 'awaited-dom/docs.json';
import { DOMParser } from 'noderdom-detached';
import { IElement, IHTMLLinkElement } from 'noderdom-detached/base/interfaces';

const docs = (rawDocs as unknown) as IDoc[];

const domParser = new DOMParser();

interface IDoc {
  name: string;
  variableName: string;
  category: string;
  tags: string;
  overview: string;
  dependencies: any[];
  properties: any[];
  methods: any[];
  events: any[];
}

const docUrls = new Map<string, string>();
for (const doc of docs) {
  docUrls.set(doc.name, decamelize(doc.name, '-'));
}

json2md.converters.html = input => input;

const awaitedDomDir = Path.resolve(__dirname, '../awaited-dom');
const docsDir = Path.resolve(__dirname, '../docs');
const awaitedDOMBasePath = Path.join(docsDir, 'BasicInterfaces', 'AwaitedDOM.base.md');
const awaitedDOMIndexPath1 = Path.join(docsDir, 'BasicInterfaces', 'AwaitedDOM.md');
const awaitedDOMIndexPath2 = Path.join(awaitedDomDir, 'index.md');

const docsByTag: { [tag: string]: IDoc[] } = {};

docs.forEach((doc: IDoc) => {
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
  if (!awaitedDOMBase.includes(placementToken)) return;

  const linksTable = extractLinksTable(docsByTag[tag], (doc: IDoc) => {
    return [doc.name, `/docs/awaited-dom/${decamelize(doc.name, '-')}`];
  });

  const markup = [{ table: linksTable }];
  const markdown = json2md(markup);
  awaitedDOMBase = awaitedDOMBase.replace(placementToken, markdown);
});

Fs.writeFileSync(awaitedDOMIndexPath1, awaitedDOMBase);
Fs.writeFileSync(awaitedDOMIndexPath2, awaitedDOMBase);

// SAVE DOC

function saveDoc(doc: IDoc, filePath: string) {
  const markup: any[] = [
    { h1: `[AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> ${doc.name}` },
  ];
  const variableName = doc.variableName || '';

  JSON.parse(doc.overview || '[]').forEach((overview: any) => {
    markup.push({ html: `<div class='overview'>${cleanupHTML(overview)}</div>` });
  });

  if (doc.tags.includes('Super') && doc.dependencies.length) {
    markup.push({ h2: 'Dependencies' });
    markup.push({
      p: `${doc.name} implements all the properties and methods of the following classes:`,
    });
    const linksTable = extractLinksTable(doc.dependencies, (dep: any) => {
      return [dep.name, `./${decamelize(dep.name, '-')}`];
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
      markup.push({ h4: `**Type**: ${urlify(p.returnType)}` });
    }
  }

  const implementedMethods = doc.methods.filter(x => x.isImplemented);
  if (implementedMethods.length) {
    markup.push({ h2: 'Methods' });
    for (const m of implementedMethods) {
      const args = m.parameters
        .map((x: any) => {
          let name = x.name;
          if (x.isVariadic) name = `...${name}`;
          else if (x.isOptional) name += '?';
          return name;
        })
        .join(', ');
      markup.push({
        h3: `${variableName}.${m.name}*(${args})* <div class="specs"><i>W3C</i></div> {#${m.name}}`,
      });
      markup.push({ html: cleanupHTML(m.overview || 'Needs content.') });
      if (m.parameters.length) {
        markup.push({ h4: `**Arguments**:` });

        const paramList: any[] = [];
        markup.push({ ul: paramList });
        for (const param of m.parameters) {
          const name = `${param.name} ${urlify(param.type)}`;
          if (param.overview?.startsWith('<ul')) {
            const details = getParameterList(param.overview || 'Needs content.');
            paramList.push(name, { ul: details });
          } else {
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
      const rows: [string, string][] = [];
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
      const rows: [string, string][] = [];
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

function asCode(code: string, appendMethodSignature = false) {
  if (code) {
    if (appendMethodSignature) return `\`${code}()\``;
    return `\`${code}\``;
  }
  return '';
}

function urlify(type: string) {
  // we don't list "isolates" in our docs
  type = type.replace('Isolate', '');

  const url =
    docUrls.get(type) ??
    docUrls.get(`Promise<${type}>`) ??
    docUrls.get(`Promise<${type}[]>`) ??
    docUrls.get(`${type}[]`);
  if (url) {
    return `[\`${type}\`](/docs/awaited-dom/${url})`;
  }
  return `\`${type}\``;
}

function getParameterList(html: string) {
  html = cleanupHTML(html);
  const document = domParser.parseFromString(html, 'text/html');
  const children = [];
  const firstList = document.querySelector('ul');
  if (!firstList) return html;
  for (const child of firstList.children) {
    children.push(child.innerHTML.trim());
  }
  return children;
}

function cleanupHTML(html: string) {
  const document = domParser.parseFromString(html, 'text/html');
  for (const a of document.querySelectorAll('a')) {
    const link = a as IHTMLLinkElement;
    const outer = link.outerHTML;
    const href = link.getAttribute('href');
    const body = link.innerHTML;
    const text = link.textContent;
    if (text === 'DOMString' || text === 'USVString') html = html.replace(outer, '`string`');
    else if (text === 'Boolean') html = html.replace(outer, '`boolean`');
    else if (text === 'Number') html = html.replace(outer, '`number`');
    else if (href?.startsWith('/')) {
      if (href.includes('Document_object_model/Locating_DOM_elements_using_selectors')) {
        link.setAttribute('target', 'mdnrel');
        link.setAttribute('href', `https://developer.mozilla.org${href}`);
        html = html.replace(outer, link.outerHTML);
      } else {
        html = html.replace(outer, body);
      }
    }
  }
  for (const tb of document.querySelectorAll('table')) {
    const table = tb as IElement;
    const outer = table.outerHTML;
    html = html.replace(
      outer,
      `
<code class="language-html">
    ${outer}
</code>

`,
    );
  }

  html = html.replace(/[\n\t]`+/g, '`');
  return html.replace(/\n\n/g, '\n');
}

function extractLinksTable(records: any[], extractLinkFn: (record: any) => [string, string]) {
  const cells: string[] = [];

  records.forEach(record => {
    const [linkName, linkHref] = extractLinkFn(record);
    cells.push(`[${linkName}](${linkHref})`);
  });

  const rows: string[][] = [];
  while (cells.length) {
    const row = cells.splice(0, 2);
    if (row.length < 2) row.push('');
    rows.push(row);
  }

  return { headers: [' ', ' '], rows };
}
