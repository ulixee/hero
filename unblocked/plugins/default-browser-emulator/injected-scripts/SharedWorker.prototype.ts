if (typeof SharedWorker === 'undefined') {
  // @ts-ignore
  return;
}

// shared workers created from blobs don't automatically pause in devtools, so we have to manipulate
proxyConstructor(self, 'SharedWorker', (target, argArray) => {
  if (!argArray?.length) return ReflectCached.construct(target, argArray);

  const [url] = argArray;
  if (!url?.toString().startsWith('blob:')) {
    return ReflectCached.construct(target, argArray);
  }

  // read blob contents synchronously
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send();
  const text = xhr.response;

  const script = `
    function original() {
      ${text};
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
          events.forEach(ev => onconnect(ev));
          delete events;
        }, 0);
      }

      function isInjectedDone() {
        try {
          // We can use this to check if injected logic is loaded
          return Error['${sourceUrl}'];
        } catch {
          return false;
        }
      }


      if (isInjectedDone()) {
        originalAsSync();
        return;
      }

      // Keep checking until we are ready
      const interval = setInterval(() => {
        if (!isInjectedDone()) {
          return
        }
        clearInterval(interval);
        originalAsSync();
      }, 20);
    })()
  `;

  const newBlob = new Blob([script]);
  return ReflectCached.construct(target, [URL.createObjectURL(newBlob)]);
});
