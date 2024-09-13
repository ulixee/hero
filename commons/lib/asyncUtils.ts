export function debounce<T extends (...args: any[]) => void | Promise<void>>(
  func: T,
  wait: number,
  maxWait?: number,
): T {
  let timeout: NodeJS.Timeout;
  let lastRun: number;

  return function runLater(...args: any[]) {
    function later(): void {
      timeout = undefined;
      void func(...args);
    }
    clearTimeout(timeout);

    if (maxWait && Date.now() - lastRun > maxWait) {
      void func(...args);
    } else {
      timeout = setTimeout(later, wait).unref();
    }
    lastRun = Date.now();
  } as T;
}

export function length(source: AsyncIterable<unknown>): Promise<number> {
  return (async () => {
    let count = 0;

    for await (const _ of source) count++;

    return count;
  })();
}

export function all<T>(source: AsyncIterable<T>): Promise<T[]> {
  return (async () => {
    const results: T[] = [];

    for await (const x of source) results.push(x);

    return results;
  })();
}

export function first<T>(source: AsyncIterable<T>): Promise<T> {
  return (async () => {
    // eslint-disable-next-line no-unreachable-loop
    for await (const entry of source) return entry;
  })();
}

export function last<T>(source: AsyncIterable<T>): Promise<T> {
  return (async () => {
    let item: T;
    for await (const entry of source) item = entry;
    return item;
  })();
}
