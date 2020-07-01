#!/usr/bin/env ts-node

import * as Fs from 'fs';
import * as Path from 'path';
import json2md from 'json2md';
import decamelize from 'decamelize';

const docs = require('awaited-dom/docs.json') as IDoc[];

interface IDoc {
  name: string;
  category: string;
  tags: string;
  overview: string;
  dependencies: any[];
  properties: any[];
  methods: any[];
  events: any[];
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
  const markup: any[] = [{ h1: `[AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> ${doc.name}` }];

  JSON.parse(doc.overview || '[]').forEach((overview: any) => {
    markup.push({ html: `<div class='overview'>${overview}</div>` });
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

  if (doc.properties.length) {
    markup.push({ h2: 'Properties' });
    const properties: string[] = [];
    doc.properties.forEach(p => {
      markup.push({ h3: `.${p.name} <div class="specs"><i>W3C</i></div> {#${p.name}}` });
      markup.push({ html: cleanupHTML(p.overview || 'Needs content.') });
      markup.push({ h4: `**Type**: \`null\`` });
    });
  }

  if (doc.methods.length) {
    markup.push({ h2: 'Methods' });
    doc.methods.forEach(m => {
      markup.push({ h3: `.${m.name}*(...args)* <div class="specs"><i>W3C</i></div> {#${m.name}}` });
      markup.push({ html: cleanupHTML(m.overview || 'Needs content.') });
      markup.push({ h4: `**Arguments**:` });
      markup.push({ ul: ['none'] });
      markup.push({ h4: '**Returns**: `Promise<void>`' });
    });
  }

  if (doc.events) {
    markup.push({ h2: 'Events' });
  }

  const markdown = json2md(markup);
  Fs.writeFileSync(filePath, markdown);
  console.log(`Saved ${filePath}`);
}

function cleanupHTML(html: string) {
  html = html.replace(/^([^\n]+)</, '$1\n<');
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
