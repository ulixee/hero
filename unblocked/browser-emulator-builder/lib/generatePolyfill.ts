import deepDiff from '@ulixee/unblocked-browser-profiler/lib/deepDiff';
import IDomPolyfill from '@ulixee/unblocked-specification/plugin/IDomPolyfill';
import { isAllowedValueDifference, isExplicitExport } from './domMatch';

export default function generatePolyfill(dom1: any, dom2: any): IDomPolyfill {
  const diff = deepDiff(dom1, dom2);
  delete diff.same;

  diff.removed = diff.removed.filter(x => {
    return !isExplicitExport(x.path);
  });

  diff.changed = diff.changed.filter(x => {
    if (isExplicitExport(x.path)) return false;
    return !isAllowedValueDifference(x);
  });

  const hasDiff =
    diff.added.length || diff.changed.length || diff.removed.length || diff.changedOrder.length;
  if (!hasDiff) return { remove: [], add: [], reorder: [], modify: [] };

  const add = diff.removed.map(x => {
    const [propertyName, pathParts] = extractPathParts(x.path);
    const parentPath = pathParts.join('.');
    const parent = get(dom1, parentPath);
    const keys = Object.keys(parent);

    const prevProperty = keys[keys.indexOf(propertyName) - 1];
    return {
      path: pathParts.join('.'),
      propertyName,
      prevProperty,
      property: x.lhs,
    };
  });

  // sort for dependencies
  add.sort((a, b) => {
    if (a.prevProperty && a.prevProperty === b.propertyName) return 1;
    if (b.prevProperty && b.prevProperty === a.propertyName) return -1;
    const aProtos = a.property?._$protos;
    if (
      aProtos &&
      b.path === 'window' &&
      (aProtos.includes(b.propertyName) || aProtos.includes(`${b.propertyName}.prototype`))
    ) {
      return 1;
    }
    const bProtos = b.property?._$protos;
    if (
      bProtos &&
      a.path === 'window' &&
      (bProtos.includes(a.propertyName) || bProtos.includes(`${a.propertyName}.prototype`))
    ) {
      return -1;
    }
    if (aProtos && !bProtos) return 1;
    if (bProtos && !aProtos) return -1;
    return 0;
  });

  const modify = diff.changed.map(x => {
    const [propertyName, pathParts] = extractPathParts(x.path);
    return {
      path: pathParts.join('.'),
      propertyName,
      property: x.lhs,
    };
  });

  const remove = diff.added
    .map(x => {
      const [propertyName, pathParts] = extractPathParts(x.path);
      return {
        path: pathParts.join('.'),
        propertyName,
      };
    })
    .filter(x => {
      const fullPath = `${x.path}.${x.propertyName}`;
      if (fullPath.match(/.+\._[\w()]+$/)) return false;
      if (fullPath.includes('.new()')) return false;
      if (fullPath.includes('_$protos')) return false;
      if (fullPath.endsWith('caller')) return false;
      if (fullPath.endsWith('arguments')) return false;
      return true;
    });

  const removeFullPaths = remove.map(x => `${x.path}.${x.propertyName}`);
  const reorder: {
    path: string;
    propertyName: string;
    prevProperty: string;
    throughProperty: string;
  }[] = [];
  for (const order of diff.changedOrder) {
    if (order.path.includes('.new()')) continue;
    const expected = order.lhs.filter(x => x[0] !== '_');
    const provided = order.rhs.filter(
      x => x[0] !== '_' && !removeFullPaths.includes(`${order.path}.${x}`),
    );
    let prev: string = null;
    let currentPropertyChangeset: any;
    for (let i = 0; i < provided.length; i += 1) {
      const propertyName = provided[i];

      // symbols enter new part of prop order
      if (
        expected[i] !== provided[i] &&
        !propertyName.startsWith('Symbol(') &&
        !prev?.startsWith('Symbol')
      ) {
        const expectedIndex = expected.indexOf(propertyName);
        const expectedPrev = expectedIndex > 0 ? expected[expectedIndex - 1] : null;
        if (expectedPrev !== prev) {
          currentPropertyChangeset = {
            path: order.path,
            propertyName,
            throughProperty: propertyName,
            prevProperty: expectedPrev,
          };
          reorder.push(currentPropertyChangeset);
        } else if (currentPropertyChangeset) {
          currentPropertyChangeset.throughProperty = propertyName;
        }
      }
      prev = propertyName;
    }
  }

  // if you depend on a prev, wait for them
  // if you depend on a through, wait for them
  reorder.sort((a, b) => {
    if (a.path === b.path) {
      // sort so that depended upon properties are moved first
      const aHasDependency = reorder.some(x => x.propertyName === a.prevProperty);
      const aHasThroughDependency = reorder.some(x => x.throughProperty === a.prevProperty);
      const bHasDependency = reorder.some(x => x.propertyName === b.prevProperty);
      const bHasThroughDependency = reorder.some(x => x.throughProperty === b.prevProperty);
      if (aHasThroughDependency && bHasThroughDependency) {
        if (b.prevProperty === a.throughProperty) return -1;
        if (a.prevProperty === b.throughProperty) return 1;

        if (aHasDependency && bHasDependency) {
          if (a.prevProperty === b.propertyName) return 1;
          if (a.propertyName === b.prevProperty) return -1;
        }
        if (aHasThroughDependency) return 1;
        if (bHasThroughDependency) return -1;
      }
      if (aHasThroughDependency) return 1;
      if (bHasThroughDependency) return -1;
      if (aHasDependency) return 1;
      if (bHasDependency) return -1;
    }
    return a.path.localeCompare(b.path);
  });

  return {
    add,
    remove,
    modify,
    reorder,
  };
}

// INTERNAL /////////

function get<T>(obj: T, path: string): T {
  let current = obj;
  const split = path.split('.');
  while (split.length) {
    const key = split.shift();
    const next = current[key];
    if (next) current = next;
    else if (split.length && split[0] === 'prototype') {
      current = current[`${key}.prototype`];
    }
  }
  return current;
}

function extractPathParts(path: string): [string, string[]] {
  let pathParts: string[];
  let propertyName: string;
  if (path.includes('Symbol(')) {
    const symbolSplit = path.split('.Symbol(');
    propertyName = symbolSplit.pop().replace(')', '');
    pathParts = symbolSplit.shift().split('.');
  } else {
    pathParts = path.split('.');
    propertyName = pathParts.pop();
  }
  return [propertyName, pathParts];
}
