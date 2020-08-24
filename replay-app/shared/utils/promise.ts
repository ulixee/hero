export default function getResolvable<T>() {
  let resolve: (obj: T) => any;
  let reject: (err: Error) => any;
  const promise = new Promise<T>((resolve1, reject1) => {
    resolve = resolve1;
    reject = reject1;
  });
  return {
    resolve,
    reject,
    promise,
  };
}
