export default function getResolvable<T>() {
  let resolveCb: (obj: T | PromiseLike<T>) => any;
  let rejectCb: (err: Error) => any;
  let isResolved = false;
  const promise = new Promise<T>((resolve, reject) => {
    resolveCb = resolve;
    rejectCb = reject;
  });
  return {
    resolve: (entry: T | PromiseLike<T>) => {
      if (isResolved) return;
      isResolved = true;
      return resolveCb(entry);
    },
    reject: (err?: Error) => {
      if (isResolved) return;
      isResolved = true;
      return rejectCb(err);
    },
    isResolved,
    promise,
  };
}
