import BaseExtractor from './BaseExtractor';

export default class WindowChangeExtractor extends BaseExtractor {
  public static override definitePatterns = [];

  public static override extraAddPatterns = [];

  public static override extraChangePatterns = [
    'window.innerWidth',
    'window.innerHeight',
    'window.visualViewport.width',
    'window.visualViewport.height',
    'window.screenX',
    'window.screenY',
    'window.outerWidth',
    'window.outerHeight',
    'window.screenLeft',
    'window.screenTop',
    'window.locationbar',

    'window.document.documentElement.offsetLeft',
    'window.document.documentElement.offsetWidth',
    'window.document.documentElement.offsetHeight',
    'window.document.documentElement.style',

    'window.document.documentElement.scrollTop',
    'window.document.documentElement.scrollLeft',
    'window.document.documentElement.scrollWidth',
    'window.document.documentElement.scrollHeight',
    'window.document.documentElement.clientLeft',
    'window.document.documentElement.clientWidth',
    'window.document.documentElement.clientHeight',

    'window.scrollbars.visible',

    'window.screen.availWidth',
    'window.screen.availHeight',
    'window.screen.width',
    'window.screen.height',
    'window.screen.availLeft',
    'window.scrollX',
    'window.scrollY',
    'window.visualViewport.offsetLeft',
    'window.visualViewport.pageLeft',
    'window.visualViewport.pageTop',

    'window.history.scrollRestoration',
    'window.document.documentElement.offsetTop',
    'window.screen.availTop',

    'window.document.documentElement.clientTop',
    'window.visualViewport.offsetTop',

    'window.devicePixelRatio',
    'window.screen.colorDepth',
    'window.screen.isExtended',
    'window.screen.pixelDepth',
  ];

  public static override ignoredExtraPatterns = [
    'window.VisualViewport.prototype.pageTop',
    'window.Touch.prototype.screenX',
    'window.Touch.prototype.screenY',
    'window.MouseEvent.prototype.screenX',
    'window.MouseEvent.prototype.screenY',
    'window.document.documentElement.onscroll',
    'window.document.onscroll',
    'window.visualViewport.onscroll',
    'window.onscroll',
    'window.chrome.csi.new().pageT',
    'window.webkitSpeechRecognition.prototype.stop.length',
    'window.webkitSpeechRecognition.prototype.stop.name',
  ];

  public static override regexps = [
    /window\.[a-z].+(W|w)idth/,
    /window\.[a-z].+(H|h)eight/,
    /window\.[a-z].+(T|t)op/,
    /window\.[a-z].+(L|l)eft/,
    /window\.[a-z].+(S|s)croll/,
    /screen[XY]/,
    /pageT/,
    /window.locationbar/,

    /window.devicePixelRatio/,
    /window.screen.isExtended/,
    /window.screen.colorDepth/,
    /window.screen.pixelDepth/,
  ];
}
