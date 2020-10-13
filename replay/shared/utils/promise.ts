export default function getResolvable<T>() {
  let resolveCb: (obj: T) => any;
  let rejectCb: (err: Error) => any;
  const promise = new Promise<T>((resolve, reject) => {
    resolveCb = resolve;
    rejectCb = reject;
  });
  return {
    resolve: resolveCb,
    reject: rejectCb,
    promise,
  };
}
