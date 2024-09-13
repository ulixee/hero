function logError() {
  // eslint-disable-next-line no-console,prefer-rest-params
  console.error(...arguments);
}
(async () => {
  const getWorkerData = async () => {
    let canvas2d;
    let webglVendor;
    let webglRenderer;
    let webgl2Vendor;
    let webgl2Renderer;
    try {
      const canvasOffscreen = new OffscreenCanvas(500, 200);
      canvasOffscreen.getContext('2d');
      const getDataURI = async () => {
        const blob = await canvasOffscreen.convertToBlob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        return new Promise(resolve => {
          reader.onloadend = () => resolve(reader.result);
        });
      };
      canvas2d = await getDataURI();

      const canvasOffscreenWebgl = new OffscreenCanvas(256, 256);
      const contextWebgl = canvasOffscreenWebgl.getContext('webgl');
      const renererInfo = contextWebgl.getExtension('WEBGL_debug_renderer_info');
      webglVendor = contextWebgl.getParameter(renererInfo.UNMASKED_VENDOR_WEBGL);
      webglRenderer = contextWebgl.getParameter(renererInfo.UNMASKED_RENDERER_WEBGL);
      try {
        const canvasOffscreenWebgl2 = new OffscreenCanvas(256, 256);
        const contextWebgl2 = canvasOffscreenWebgl2.getContext('webgl2');
        const renerer2Info = contextWebgl2.getExtension('WEBGL_debug_renderer_info');
        webgl2Vendor = contextWebgl2.getParameter(renerer2Info.UNMASKED_VENDOR_WEBGL);
        webgl2Renderer = contextWebgl2.getParameter(renerer2Info.UNMASKED_RENDERER_WEBGL);
      } catch (error) {
        logError(error);
      }
    } catch (error) {
      logError(error);
    }

    const timezoneLocation = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { deviceMemory, hardwareConcurrency, language, platform, userAgent } = navigator;
    return {
      timezoneLocation,
      language,
      deviceMemory,
      hardwareConcurrency,
      userAgent,
      platform,
      canvas2d,
      webglVendor,
      webglRenderer,
      webgl2Vendor,
      webgl2Renderer,
    };
  };

  // Tests
  // eslint-disable-next-line no-undef
  const isWorker = !globalThis.document && !!globalThis.WorkerGlobalScope;
  // eslint-disable-next-line no-undef
  const isSharedWorker = !!globalThis.SharedWorkerGlobalScope;
  // eslint-disable-next-line no-undef
  const isServiceWorker = !!globalThis.ServiceWorkerGlobalScope;

  // WorkerGlobalScope
  const getWorkerGlobalScope = async () => {
    const data = await getWorkerData();
    postMessage(data);
    // eslint-disable-next-line no-restricted-globals
    close();
  };

  const getDedicatedWorker = phantomDarkness => {
    return new Promise(resolve => {
      try {
        if (phantomDarkness && !phantomDarkness.Worker) {
          return resolve({});
        }
        if (phantomDarkness && phantomDarkness.Worker.prototype.constructor.name !== 'Worker') {
          throw new Error('Worker tampered with by client');
        }
        const WorkerSConstructor = phantomDarkness ? phantomDarkness.Worker : Worker;
        const dedicatedWorker = new WorkerSConstructor(document.currentScript.src);
        dedicatedWorker.onmessage = message => {
          dedicatedWorker.terminate();
          return resolve(message.data);
        };
      } catch (error) {
        logError(error);
        return resolve({});
      }
    });
  };

  // SharedWorkerGlobalScope
  const getSharedWorkerGlobalScope = () => {
    // eslint-disable-next-line no-undef
    onconnect = async message => {
      const port = message.ports[0];
      const data = await getWorkerData();
      port.postMessage(data);
    };
  };

  const getSharedWorker = phantomDarkness => {
    return new Promise(resolve => {
      try {
        if (phantomDarkness && !phantomDarkness.SharedWorker) {
          return resolve({});
        }
        if (
          phantomDarkness &&
          phantomDarkness.SharedWorker.prototype.constructor.name !== 'SharedWorker'
        ) {
          throw new Error('SharedWorker tampered with by client');
        }
        const WorkerSConstructor = phantomDarkness ? phantomDarkness.SharedWorker : SharedWorker;
        const sharedWorker = new WorkerSConstructor(document.currentScript.src);
        sharedWorker.port.start();
        sharedWorker.port.addEventListener('message', message => {
          sharedWorker.port.close();
          return resolve(message.data);
        });
      } catch (error) {
        logError(error);
        return resolve({});
      }
    });
  };

  // ServiceWorkerGlobalScope
  const getServiceWorkerGlobalScope = () => {
    const broadcast = new BroadcastChannel('creep_service');
    broadcast.onmessage = async event => {
      if (event.data && event.data.type === 'fingerprint') {
        const data = await getWorkerData();
        broadcast.postMessage(data);
      }
    };
  };

  const getServiceWorker = () => {
    return new Promise(resolve => {
      try {
        if (!('serviceWorker' in navigator)) {
          return resolve({});
        }
        // eslint-disable-next-line no-proto
        if (navigator.serviceWorker.__proto__.constructor.name !== 'ServiceWorkerContainer') {
          throw new Error('ServiceWorkerContainer tampered with by client');
        }
        navigator.serviceWorker
          .register(document.currentScript.src, {
            // scope: 'tests/',
          })
          .catch(error => {
            logError(error);
            return resolve({});
          });
        navigator.serviceWorker.ready
          .then(registration => {
            const broadcast = new BroadcastChannel('creep_service');
            broadcast.onmessage = message => {
              registration.unregister();
              broadcast.close();
              return resolve(message.data);
            };
            return broadcast.postMessage({ type: 'fingerprint' });
          })
          .catch(error => {
            logError(error);
            return resolve({});
          });
      } catch (error) {
        logError(error);
        return resolve({});
      }
    });
  };

  // WorkerGlobalScope
  if (isWorker) {
    // eslint-disable-next-line no-nested-ternary
    return isServiceWorker
      ? getServiceWorkerGlobalScope()
      : isSharedWorker
      ? getSharedWorkerGlobalScope()
      : getWorkerGlobalScope();
  }

  // Window
  // frame
  const ghost = () => `
	height: 100vh;
	width: 100vw;
	position: absolute;
	left:-10000px;
	visibility: hidden;
`;
  const getRandomValues = () => {
    const id = [...crypto.getRandomValues(new Uint32Array(10))].map(n => n.toString(36)).join('');
    return id;
  };
  const getPhantomIframe = () => {
    try {
      const numberOfIframes = window.length;
      const frag = new DocumentFragment();
      const div = document.createElement('div');
      const id = getRandomValues();
      div.setAttribute('id', id);
      frag.appendChild(div);
      div.innerHTML = `<div style="${ghost()}"><iframe></iframe></div>`;
      document.body.appendChild(frag);
      const iframeWindow = window[numberOfIframes];
      return { iframeWindow, div };
    } catch (error) {
      logError('getPhantomIframe', error);
      return { iframeWindow: window, div: undefined };
    }
  };
  const { iframeWindow: phantomDarkness, div: parentPhantom } = getPhantomIframe();

  const [windowScope, dedicatedWorker, sharedWorker, serviceWorker] = await Promise.all([
    getWorkerData(),
    getDedicatedWorker(phantomDarkness),
    getSharedWorker(phantomDarkness),
    getServiceWorker(),
  ]).catch(error => {
    logError(error.message);
  });

  if (parentPhantom) {
    parentPhantom.parentNode.removeChild(parentPhantom);
  }

  await fetch('/worker-result', {
    method: 'POST',
    body: JSON.stringify({ windowScope, dedicatedWorker, sharedWorker, serviceWorker }),
  });
})().catch(console.error);
