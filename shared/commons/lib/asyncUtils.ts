export function debounce(func: () => any, wait: number): () => void {
  let timeout: NodeJS.Timeout;

  return function runLater() {
    function later(): void {
      timeout = undefined;
      func();
    }

    clearTimeout(timeout);
    timeout = setTimeout(later, wait).unref();
  };
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
