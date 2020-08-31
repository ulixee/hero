function toSeconds(millis) {
  let entry = (millis / 1000).toFixed(3);
  if (entry.endsWith('0')) entry = entry.substr(0, entry.length - 1);
  return parseFloat(entry);
}
// from https://developers.google.com/web/updates/2017/12/chrome-loadtimes-deprecated
const loadTimeConversion = {
  requestTime() {
    const ntEntry = performance.getEntriesByType('navigation')[0];
    const start = ntEntry ? ntEntry.startTime : 0;
    return toSeconds(start + performance.timeOrigin);
  },
  startLoadTime() {
    const ntEntry = performance.getEntriesByType('navigation')[0];
    const start = ntEntry ? ntEntry.startTime : 0;
    return toSeconds(start + performance.timeOrigin);
  },
  commitLoadTime() {
    const ntEntry = performance.getEntriesByType('navigation')[0];
    const start = ntEntry ? ntEntry.responseStart : 0;
    return toSeconds(start + performance.timeOrigin);
  },
  finishDocumentLoadTime() {
    const ntEntry = performance.getEntriesByType('navigation')[0];
    const start = ntEntry ? ntEntry.domContentLoadedEventEnd : 0;
    return toSeconds(start + performance.timeOrigin);
  },
  finishLoadTime() {
    const ntEntry = performance.getEntriesByType('navigation')[0];
    const start = ntEntry ? ntEntry.loadEventEnd : 0;
    return toSeconds(start + performance.timeOrigin);
  },
  firstPaintTime() {
    let fpEntry = performance.getEntriesByType('paint')[0];
    if (!fpEntry) {
      const ntEntry = performance.getEntriesByType('navigation')[0];
      const start = ntEntry ? ntEntry.loadEventEnd : 0;
      fpEntry = { startTime: start + Math.random() * 85 };
    }
    return toSeconds(fpEntry.startTime + performance.timeOrigin);
  },
  navigationType() {
    const ntEntry = performance.getEntriesByType('navigation')[0];
    if (!ntEntry) return 'Other';
    switch (ntEntry.type) {
      case 'back_forward':
        return 'BackForward';
      case 'reload':
        return 'Reload';
      case 'prerender':
      case 'navigate':
      default:
        return 'Other';
    }
    // case blink::kWebNavigationTypeLinkClicked:
    //  return "LinkClicked";
    // case blink::kWebNavigationTypeFormSubmitted:
    //  return "FormSubmitted";
    // case blink::kWebNavigationTypeFormResubmitted:
    //  return "Resubmitted";
  },
  wasFetchedViaSpdy() {
    // SPDY is deprecated in favor of HTTP/2, but this implementation returns
    // true for HTTP/2 or HTTP2+QUIC/39 as well.
    const ntEntry = performance.getEntriesByType('navigation')[0];
    if (!ntEntry) return true;
    return ['h2', 'hq'].includes(ntEntry.nextHopProtocol);
  },
  wasNpnNegotiated() {
    // NPN is deprecated in favor of ALPN, but this implementation returns true
    // for HTTP/2 or HTTP2+QUIC/39 requests negotiated via ALPN.
    const ntEntry = performance.getEntriesByType('navigation')[0];
    if (!ntEntry) return true;
    return ['h2', 'hq'].includes(ntEntry.nextHopProtocol);
  },
  connectionInfo() {
    const ntEntry = performance.getEntriesByType('navigation')[0];
    if (!ntEntry) return 'h2';
    return ntEntry.nextHopProtocol;
  },
};

const csiConversion = {
  startE() {
    const ntEntry = performance.getEntriesByType('navigation')[0];
    const start = ntEntry ? ntEntry.loadEventEnd : 0;
    return parseInt(start + performance.timeOrigin, 10);
  },
  onloadT() {
    const ntEntry = performance.getEntriesByType('navigation')[0];
    const load = ntEntry ? ntEntry.domContentLoadedEventEnd : 0;
    return parseInt(load + performance.timeOrigin, 10);
  },
  pageT() {
    return parseFloat(performance.now().toFixed(3));
  },
  tran() {
    const ntEntry = performance.getEntriesByType('navigation')[0];
    const type = ntEntry ? ntEntry.type : 'navigate';
    // https://chromium.googlesource.com/chromium/src.git/+/master/chrome/renderer/loadtimes_extension_bindings.cc
    switch (type) {
      case 'back_forward':
        return 6;
      case 'reload':
        return 16;
      case 'prerender':
      case 'navigate':
      default:
        return 15;
    }
    /**
     *
     const int kTransitionLink = 0;
     
     case blink::kWebNavigationTypeLinkClicked:
     case blink::kWebNavigationTypeFormSubmitted:
     case blink::kWebNavigationTypeFormResubmitted:
     return kTransitionLink;
     */
  },
};

const polyfill = args.polyfill;
const { prevProperty, property } = polyfill;
if (args.updateLoadTimes) {
  for (const [name, func] of Object.entries(loadTimeConversion)) {
    property.loadTimes['new()'][name]['_value()'] = func;
  }
  for (const [name, func] of Object.entries(csiConversion)) {
    property.csi['new()'][name]['_value()'] = func;
  }
}

addDescriptorAfterProperty('window', prevProperty, 'chrome', buildDescriptor(property));
