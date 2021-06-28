export interface FlatJson extends FlattenJsonOptions {
  id?: number;
  content: string;
  level: number;
  highlighted?: boolean;
  scrollIntoView?: boolean;
  path: string;
}

interface FlattenJsonOptions {
  key?: string;
  index?: number;
  showComma?: boolean;
  type?: string;
  isContent?: boolean;
}

export default function flattenJson(
  data: any,
  path = '',
  level = 0,
  options: FlattenJsonOptions = {},
): FlatJson[] {
  const { key, index, showComma = false } = options;
  const type = Object.prototype.toString.call(data).slice(8, -1).toLowerCase();

  if (typeof data === 'object') {
    const isArray = type === 'array';

    const results: FlatJson[] = [
      {
        content: isArray ? '[' : '{',
        level,
        key,
        path,
      },
    ];
    const keys = Object.keys(data);

    for (let idx = 0; idx < keys.length; idx += 1) {
      const objKey = isArray ? idx : keys[idx];
      let childPath = `${path}.${objKey}`;
      if (isArray) childPath = path ? `${path}.[${objKey}]` : `[${objKey}]`;
      else if ((objKey as string).includes('.')) {
        childPath = `${path}["${objKey}"]`;
      }

      const flattenJsonOptions: FlattenJsonOptions = {
        showComma: idx !== keys.length - 1,
        isContent: true,
      };
      if (isArray) {
        flattenJsonOptions.index = idx;
      } else {
        flattenJsonOptions.key = objKey as string;
      }
      const childRecords = flattenJson(data[objKey], childPath, level + 1, flattenJsonOptions);
      results.push(...childRecords);
    }

    results.push({
      content: isArray ? ']' : '}',
      showComma,
      level,
      path,
    });
    return results;
  }

  const output: FlatJson = {
    content: data,
    level,
    key,
    index,
    path,
    showComma,
    isContent: true,
    type,
  };

  return [output];
}
