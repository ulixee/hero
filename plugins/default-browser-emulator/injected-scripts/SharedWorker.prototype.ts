import type { ScriptInput } from './_utils';

export type Args = never;

export function main({
  sourceUrl,
  utils: { ObjectCached, ReflectCached, toOriginalFn },
}: ScriptInput<Args>) {
  if (typeof SharedWorker === 'undefined') {
    return;
  }

  const OriginalSharedWorker = SharedWorker;
  const originalSharedWorkerProperties = ObjectCached.getOwnPropertyDescriptors(SharedWorker);

  // shared workers created from blobs don't automatically pause in devtools, so we have to manipulate
  ObjectCached.defineProperty(self, 'SharedWorker', {
    // eslint-disable-next-line object-shorthand
    value: function SharedWorker(this, scriptURL, options) {
      // eslint-disable-next-line strict
      'use strict';
      if (!new.target) {
        return ReflectCached.apply(OriginalSharedWorker, this, [scriptURL, options]);
      }

      let isBlob = false;
      try {
        isBlob = scriptURL?.toString().startsWith('blob:');
      } catch {}
      if (!isBlob) {
        return ReflectCached.construct(OriginalSharedWorker, [scriptURL, options], new.target);
      }

      // read blob contents synchronously
      const xhr = new XMLHttpRequest();
      xhr.open('GET', scriptURL, false);
      xhr.send();
      const text = xhr.response;

      const script = createScript(text);

      const newBlob = new Blob([script]);
      return ReflectCached.construct(
        OriginalSharedWorker,
        [URL.createObjectURL(newBlob), options],
        new.target,
      );
    },
  });

  ObjectCached.defineProperties(SharedWorker, originalSharedWorkerProperties);
  SharedWorker.prototype.constructor = SharedWorker;
  toOriginalFn.set(SharedWorker, OriginalSharedWorker);

  function createScript(originalScript: string) {
    const script = `
    function original() {
      ${originalScript};
    }

    (async function runWhenReady() {
      // Buffer events until we are ready, onconnect will be replaced later when running the original script.
      const events = [];
      const storeEvent = (event) => {events.push(event)};
      addEventListener('connect', storeEvent);

      function originalAsSync() {
        // setTimeout so we run sync instead of async
        setTimeout(()=> {
          removeEventListener('connect', storeEvent);
          original();
          events.forEach(ev => dispatchEvent(ev));
          delete events;
        }, 0);
      }

      // See proxyUtils
      function getSharedStorage() {
        try {
          return Function.prototype.toString('${sourceUrl}');
        } catch {
          return undefined;
        }
      }

      if (getSharedStorage()?.ready) {
        originalAsSync();
        return;
      }

      // Keep checking until we are ready
      const interval = setInterval(() => {
        if (getSharedStorage()?.ready) {
          clearInterval(interval);
          originalAsSync();
        }
      }, 20);
    })()
  `;
    return script;
  }
}
