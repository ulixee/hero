Detections Still TODO:

- browser/dom-worker
  - check full scope of js env in various workers (service, dedicated, shared)
- browser/dom-frame
  - check full scope of js env in various iframes (sandbox, cross-domain, etc)
- browser/javascript
- browser/tampering
  - look for Javascript proxies, mismatch of dom (Creepjs is great at this)
- browser/vm
- browser/webgl
- browser/render
  - browser renders dimensions differently per platform/browser
- browser/voice
  - look for available voices - some are OS specific
- http/referrers
- http/cache
- http/favicon
  - favicons are requested in headed differently than headless
- tls/clienthello-ws
  - websockets don't have an alpn for http2 in Chrome
- user/interaction
- user/mouse

- http/headers + http/cookies:

  - Http delete/update (trigger from forms?)
  - Direct loads without referrers
  - Prefetch
  - Signed Exchange
  - Http2 headers/trailers
  - Sec CH-UA headers

- ip/address:

  - Socket reuse

- Audio context (new plugin?):
  - https://github.com/cozylife/audio-fingerprint
