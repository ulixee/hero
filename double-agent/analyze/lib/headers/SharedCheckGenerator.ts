import IHeaderDataPage from '@double-agent/collect/interfaces/IHeaderDataPage';
import DefaultValueCheck from '../checks/DefaultValueCheck';
import StringCaseCheck from '../checks/StringCaseCheck';
import ArrayOrderIndexCheck from '../checks/ArrayOrderIndexCheck';
import { isOfficialDefaultValueKey, isOfficialHeader } from './Utils';
import BaseCheck, { ICheckMeta } from '../checks/BaseCheck';

export default class SharedCheckGenerator {
  constructor(readonly userAgentId: string, readonly data: IHeaderDataPage[]) {}

  public createDefaultValueChecks(): BaseCheck[] {
    const defaultValuesMap: {
      [protocol: string]: {
        [httpMethod: string]: {
          [resourceType: string]: {
            [key: string]: Set<string>;
          };
        };
      };
    } = {};
    const checks: BaseCheck[] = [];

    for (const page of this.data) {
      const { protocol, method: httpMethod, resourceType } = page;
      // Preflight default values vary based on the headers and other attributes of the Xhr
      defaultValuesMap[protocol] ??= {};
      defaultValuesMap[protocol][httpMethod] ??= {};
      defaultValuesMap[protocol][httpMethod][resourceType] ??= {};
      const resourceValues = defaultValuesMap[protocol][httpMethod][resourceType];
      for (const [key, value] of page.rawHeaders) {
        if (!isOfficialDefaultValueKey(key)) continue;
        const lowerKey = key.toLowerCase();
        resourceValues[lowerKey] ??= new Set();
        resourceValues[lowerKey].add(value);
      }
    }

    for (const [protocol, methods] of Object.entries(defaultValuesMap)) {
      for (const [httpMethod, resources] of Object.entries(methods)) {
        for (const [resourceType, valuesByKey] of Object.entries(resources)) {
          for (const [key, values] of Object.entries(valuesByKey)) {
            const path = `${resourceType}:${key}`;
            const meta = <ICheckMeta>{ path, protocol, httpMethod };
            const check = new DefaultValueCheck(
              { userAgentId: this.userAgentId },
              meta,
              Array.from(values),
            );
            checks.push(check);
          }
        }
      }
    }
    return checks;
  }

  public createHeaderCaseChecks(...includeHeaders: string[]): BaseCheck[] {
    const checks: BaseCheck[] = [];

    for (const page of this.data) {
      const { protocol, method: httpMethod } = page;

      for (const [key] of page.rawHeaders) {
        if (!isOfficialHeader(key) && !includeHeaders.includes(key.toLowerCase())) continue;
        const path = `${key.toLowerCase()}`;
        const meta = <ICheckMeta>{ path, protocol, httpMethod };
        const check = new StringCaseCheck({ userAgentId: this.userAgentId }, meta, key);
        checks.push(check);
      }
    }
    return checks;
  }

  public createHeaderOrderChecks(...excludeHeaders: string[]): BaseCheck[] {
    const checks: BaseCheck[] = [];
    const headerKeysMap: {
      [protocol: string]: {
        [httpMethod: string]: {
          [origin_resourceType_redirect_cookie: string]: string[][];
        };
      };
    } = {};

    for (const page of this.data) {
      const { protocol, method: httpMethod, originType, resourceType, isRedirect } = page;

      const keys = page.rawHeaders
        .map(x => x[0].toLowerCase())
        .filter(isOfficialHeader)
        .filter(x => !excludeHeaders.includes(x));
      if (!keys.length) continue;
      const withCookie = keys.includes('cookie') ? 'cookie' : 'nocookie';

      const resourceKey = `${originType}:${resourceType}:${
        isRedirect ? 'redirect' : 'direct'
      }:${withCookie}`;
      headerKeysMap[protocol] ??= {};
      headerKeysMap[protocol][httpMethod] ??= {};
      headerKeysMap[protocol][httpMethod][resourceKey] ??= [];
      const entries = headerKeysMap[protocol][httpMethod][resourceKey];
      if (!entries.some(x => x.toString() === keys.toString())) {
        entries.push(keys);
      }
    }

    for (const protocol of Object.keys(headerKeysMap)) {
      for (const [httpMethod, resourceKeys] of Object.entries(headerKeysMap[protocol])) {
        for (const [resourceKey, headerKeys] of Object.entries(resourceKeys)) {
          const orderIndexMap = extractOrderIndexMapFromArrays(headerKeys);
          for (const key of Object.keys(orderIndexMap)) {
            const orderIndex = orderIndexMap[key];
            const path = `headers:${resourceKey}:${key}`;
            const meta = <ICheckMeta>{ path, protocol, httpMethod };
            const check = new ArrayOrderIndexCheck(
              { userAgentId: this.userAgentId },
              meta,
              orderIndex,
            );
            checks.push(check);
          }
        }
      }
    }
    return checks;
  }
}

export function extractOrderIndexMapFromArrays(arrays: string[][]): {
  [key: string]: [string[], string[]];
} {
  const tmpIndex: { [key: string]: { prev: Set<string>; next: Set<string> } } = {};
  const finalIndex: { [key: string]: [string[], string[]] } = {};

  for (const array of arrays) {
    array.forEach((key, i) => {
      tmpIndex[key] = tmpIndex[key] || { prev: new Set(), next: new Set() };
      array.slice(0, i).forEach(prev => tmpIndex[key].prev.add(prev));
      array.slice(i + 1).forEach(next => tmpIndex[key].next.add(next));
      finalIndex[key] = finalIndex[key] || [[], []];
      finalIndex[key][0] = Array.from(tmpIndex[key].prev);
      finalIndex[key][1] = Array.from(tmpIndex[key].next);
    });
  }

  return finalIndex;
}
