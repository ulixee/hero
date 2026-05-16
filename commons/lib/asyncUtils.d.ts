export declare function debounce<T extends (...args: any[]) => void | Promise<void>>(func: T, wait: number, maxWait?: number): T;
export declare function length(source: AsyncIterable<unknown>): Promise<number>;
export declare function all<T>(source: AsyncIterable<T>): Promise<T[]>;
export declare function first<T>(source: AsyncIterable<T>): Promise<T>;
export declare function last<T>(source: AsyncIterable<T>): Promise<T>;
