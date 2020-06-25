#!/usr/bin/env ts-node

// tslint:disable:prefer-template

import * as Fs from 'fs';
import * as Path from 'path';
import json2md from 'json2md';
import Yaml from 'js-yaml';

const domDocsPath = Path.resolve(__dirname, 'dom-docs.json');
const baseDir = Path.resolve(__dirname);
const linksBasePath = Path.resolve(baseDir, 'links-base.yaml');
const linksPath = Path.resolve(baseDir, 'links.yaml');

const domDocs = JSON.parse(Fs.readFileSync(domDocsPath, 'utf-8'));
const links = Yaml.load(Fs.readFileSync(linksBasePath, 'utf-8'));
const linksByCategory: any = {
  Basics: {
    title: 'Basics',
    items: [],
  },
};

json2md.converters.html = input => input;

domDocs.forEach((domDoc: any) => {
  if (!domDoc.category) {
    throw new Error(`${domDoc.category}/ does not exist`);
  }

  switch (domDoc.category) {
    case 'DOMCore': {
      domDoc.category = 'Basics';
      break;
    }
    case 'CherryPicked': {
      domDoc.category = 'Miscellaneous';
      break;
    }
    case 'Custom': {
      domDoc.category = 'Miscellaneous';
      break;
    }
  }

  const categoryDir = Path.join(baseDir, domDoc.category);
  const categoryDirExists = Fs.existsSync(categoryDir);
  if (!categoryDirExists) Fs.mkdirSync(categoryDir);

  linksByCategory[domDoc.category] = linksByCategory[domDoc.category] || {
    title: domDoc.category,
    items: [],
  };
  linksByCategory[domDoc.category].items.push(domDoc.name);

  const interfaceDir = Path.join(categoryDir, domDoc.name);
  const interfaceDirExists = Fs.existsSync(interfaceDir);
  if (!interfaceDirExists) Fs.mkdirSync(interfaceDir);

  const filePath = Path.join(interfaceDir, `index.md`);
  const markup: any[] = [{ h1: domDoc.name }];

  JSON.parse(domDoc.overview || '[]').forEach(overview => {
    markup.push({ html: `<div class='overview'>${overview}</div>` });
  });

  {
    markup.push({ h2: 'Properties' });
    const list = [];
    domDoc.properties.forEach(p => {
      list.push(
        '  <li>\n' +
          `    <a href="">${p.name}</a>\n` +
          `    <div>${(p.overview || '').replace(/\n\n/g, '\n')}</div>\n` +
          '  </li>',
      );
    });
    markup.push({ html: `<ul class="items properties">\n${list.join('\n')}\n</ul>` });
  }

  {
    markup.push({ h2: 'Methods' });
    const list = [];
    domDoc.methods.forEach(m => {
      list.push(
        '  <li>\n' +
          `    <a href="">${m.name}()</a>\n` +
          `    <div>${(m.overview || '').replace(/\n\n/g, '\n')}</div>\n` +
          '  </li>',
      );
    });
    markup.push({ html: `<ul class="items methods">\n${list.join('\n')}\n</ul>` });
  }

  markup.push({ h2: 'Events' });

  const markdown = json2md(markup);
  Fs.writeFileSync(filePath, markdown);
});

links.push(...Object.values(linksByCategory));
Fs.writeFileSync(linksPath, Yaml.dump(links));
