export declare function filterUndefined<T>(object: T, omitKeys?: string[]): Partial<T>;
export declare function omit<T, Keys extends keyof T & string>(object: T, keys: Keys[]): Pick<T, Exclude<keyof T, Keys>>;
export declare function pick<T, Keys extends keyof T & string>(object: T, keys: Keys[]): Pick<T, Exclude<keyof T, Keys>>;
