export function filterUndefined<T>(object: T, omitKeys?: string[]): Partial<T> {
  if (!object) return object;
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(object)) {
    if (omitKeys?.includes(key)) continue;
    if (value !== undefined) result[key] = value;
  }
  return result;
}

export function omit<T, Keys extends keyof T & string>(
  object: T,
  keys: Keys[],
): Pick<T, Exclude<keyof T, Keys>> {
  object = Object(object);
  const result = {} as any;

  for (const [key, value] of Object.entries(object)) {
    if (!keys.includes(key as any)) {
      result[key] = value;
    }
  }
  return result;
}
