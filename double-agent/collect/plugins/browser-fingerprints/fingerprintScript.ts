import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';

export default function fingerprintScript(ctx: IRequestContext) {
  return `
<script type="text/javascript">
(() => {
  const browserIgnoredAttributes = ${JSON.stringify(browserIgnoredAttributes)};
  const sessionIgnoredAttributes = ${JSON.stringify(sessionIgnoredAttributes)};
  let fingerprintResolved;
  let fingerprintReject;
  const fingerprintPromise = new Promise((resolve, reject) => {
    fingerprintResolved = resolve;
    fingerprintReject = reject;
  });
  
  function fingerprint() {
    Fingerprint2.get(
      {
        // exclude all the "Detections" of false behavior - we cover these in other places
        excludes: {
          enumerateDevices: false,
          pixelRatio: false,
          doNotTrack: false,
        },
      },
      components => {
        try {
          const browserValues = components
            .filter(x => !browserIgnoredAttributes.includes(x.key))
            .map(x => x.value);
          
          const sessionValues = components
            .filter(x => !sessionIgnoredAttributes.includes(x.key))
            .map(x => x.value);
  
          const browserHash = Fingerprint2.x64hash128(browserValues.join(''), 31);
          const sessionHash = Fingerprint2.x64hash128(sessionValues.join(''), 31);
  
          fetch('${ctx.buildUrl('/save')}', {
            method: 'POST',
            body: JSON.stringify({
              originatedAt: '${ctx.url.pathname}',
              components,
              browserHash,
              sessionHash,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          }).then(fingerprintResolved).catch(fingerprintReject);
        } catch(err) {
          fingerprintReject(err)
        }
      },
    );
  }

  window.pageQueue.push(fingerprintPromise);
  //fingerprint();

  if (window.requestIdleCallback) {
    requestIdleCallback(fingerprint);
  } else {
    setTimeout(fingerprint, 100);
  }
})();
</script>`;
}

const checkedOtherPlaces = [
  'webdriver',
  'hasLiedLanguages',
  'hasLiedResolution',
  'hasLiedOs',
  'hasLiedBrowser',
];

export const browserIgnoredAttributes = ['userAgent', 'platform', 'enumerateDevices'].concat(
  checkedOtherPlaces,
);
export const sessionIgnoredAttributes = ['canvas', 'webgl', 'enumerateDevices'].concat(
  checkedOtherPlaces,
);
