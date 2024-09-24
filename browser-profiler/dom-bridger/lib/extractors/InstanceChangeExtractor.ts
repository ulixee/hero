import BaseExtractor from './BaseExtractor';

export default class InstanceChangeExtractor extends BaseExtractor {
  public static override definitePatterns = [
    'window.Date',
    'window.Math.random',
    'window.webkitMediaStream.new().id',
    'window.Document.new().lastModified',
    'window.navigator.connection.downlink',
    'window.performance.timeOrigin',
    'window.performance.memory.totalJSHeapSize',
    'window.performance.memory.usedJSHeapSize',
    'window.performance.timing.navigationStart',
    'window.performance.timing.fetchStart',
    'window.performance.timing.domainLookupStart',
    'window.performance.timing.domainLookupEnd',
    'window.performance.timing.connectStart',
    'window.performance.timing.connectEnd',
    'window.performance.timing.secureConnectionStart',
    'window.performance.timing.requestStart',
    'window.performance.timing.responseStart',
    'window.performance.timing.responseEnd',
    'window.performance.timing.domLoading',
    'window.performance.timing.domInteractive',
    'window.performance.timing.domContentLoadedEventStart',
    'window.performance.timing.domContentLoadedEventEnd',
    'window.performance.timing.domComplete',
    'window.performance.timing.loadEventStart',
    'window.performance.timing.loadEventEnd',
    'window.Performance.prototype.getEntries',
    'window.chrome.loadTimes',
    'window.chrome.csi',
    'window.Animation.new().ready.timeline.currentTime',
    'window.DocumentTimeline.new().currentTime',
    'window.navigator.hardwareConcurrency',
    'window.Animation.new().timeline.currentTime',
    'window.navigator.deviceMemory',
    'window.console.memory.jsHeapSizeLimit',
    'window.performance.memory.jsHeapSizeLimit',
    'window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable',
    'window.navigator.appVersion',
    'window.navigator.userAgent',
    'window.AudioContext.new().destination.context.sampleRate',
    'window.AudioContext.new().sampleRate',
    'window.navigator.connection.rtt',
    'window.navigation.currentEntry',
    'window.performance.timing.toJSON',
    'window.performance.toJSON',
    'window.performance.now',
    'window.document.documentElement.getInnerHTML',
    'window.Element.prototype.getHTML',
    'window.Navigator.prototype.createAuctionNonce',
    'window.webkitRTCPeerConnection.new().createOffer',
    'window.RTCPeerConnection.new().createOffer',
    'window.crypto.randomUUID',
    'window.navigator.storage.estimate',
    'window.document.hasFocus',
    'window.navigator.mediaDevices.enumerateDevices',
    'window.navigator.requestMIDIAccess',
    'window.navigator.clipboard.readText',
    'window.Element.prototype.requestPointerLock',
    'window.Animation.new().finished.startTime'
  ];

  public static override extraAddPatterns = [];

  public static override extraChangePatterns = [
    'window.Intl.DateTimeFormat.new().resolvedOptions',
    'window.Intl.DateTimeFormat.new().format',
    'window.console.memory.usedJSHeapSize',
    'window.BaseAudioContext.prototype.state',
    'window.BaseAudioContext.prototype.onstatechange',
    'window.AudioContext.new().destination.context.state',
    'window.AudioContext.new().destination.context.onstatechange',
    'window.AudioContext.new().state',
    'window.AudioContext.new().onstatechange',
    'window.document.readyState',
    'window.navigator.connection.onchange',
    'window.navigator.connection.effectiveType',
    'window.navigator.connection.saveData',
    'window.document.styleSheets',
    'window.document.scripts',
    'window.console.memory.jsHeapSizeLimit',
    'window.document.visibilityState',
    'window.document.webkitVisibilityState',
    'window.navigator.connection',
    'window.BarcodeDetector.getSupportedFormats',
    'window.BaseAudioContext.prototype.currentTime',
    'window.AudioContext.new().baseLatency',
    'window.AudioContext.new().destination.context.baseLatency',
    'window.AudioContext.new().destination.context.currentTime',
    'window.AudioContext.new().currentTime',
    'window.document.fonts.ready',
    'window.ScrollTimeline',
  ];

  public static override ignoredExtraPatterns = [];

  public static override regexps = [
    /AudioContext.new.+.baseLatency/,
    /AudioContext.+currentTime/, // can be 0 if stop gets triggered by dom perusal
    /AudioContext.*state/,
    /window.document.readyState/,

    /loadTimes.+wasNpnNegotiated/, // depends on user connection

    /window.document.visibilityState/,
    /window.document.webkitVisibilityState/,

    /window.navigation.currentEntry.*/,
    /memory.usedJSHeapSize/,
    /navigator.connection.*/,
    /window.performance.timeOrigin/,
    /window.performance.memory.totalJSHeapSize/,
    /window.performance.timing.domainLookupStart/,
    /window.performance.timing.domainLookupEnd/,
    /window.performance.timing.(domContentLoadedEventStart|domContentLoadedEventEnd|domInteractive|secureConnectionStart|loadEventStart|loadEventEnd|domComplete|navigationStart|fetchStart|connectStart|connectEnd|requestStart|responseStart|responseEnd|domLoading)/,
    /window.performance.timing.(domContentLoadedEventStart|domContentLoadedEventEnd|domInteractive|secureConnectionStart|loadEventStart|loadEventEnd|domComplete|navigationStart|fetchStart|connectStart|connectEnd|requestStart|responseStart|responseEnd|domLoading)/,
    /window.navigator.hardwareConcurrency/, // TODO: Add once we have better grasp of device ranges
    /window.Animation.new\(\).ready.timeline.currentTime/,
    /window.Animation.new\(\).timeline.currentTime/,
    /window.Animation.new\(\).finished.startTime/,
    /window.DocumentTimeline.new\(\).currentTime/,

    /window.Math.random/,
    /window.Date/,
    /window.chrome.csi/,
    /window.chrome.loadTimes/,

    /window.Intl.DateTimeFormat/,
    /navigator.appVersion/,
    /navigator.userAgent/,
    /Document.new.+lastModified/,
    /window.ScrollTimeline/,

    /window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable/,

    /window.AudioContext.new\(\).destination.context.sampleRate/,
    /window.AudioContext.new\(\).sampleRate/,

    /window.navigator.deviceMemory/,
    /window.console.memory.jsHeapSizeLimit/,
    /window.performance.memory.jsHeapSizeLimit/,

    /stack._\$value/,
    /window.document.styleSheets/,
    /window.document.scripts/,
    /window.document.fonts.ready/, // TODO: Ignoring this for now... not sure why it only shows up sometimes

    /window.BarcodeDetector.getSupportedFormats/, // TODO: Add once we solve why BrowserStack is returning empty arrays on some OSes
  ];
}
