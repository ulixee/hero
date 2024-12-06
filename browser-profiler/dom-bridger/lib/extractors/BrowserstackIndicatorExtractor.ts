import BaseExtractor from './BaseExtractor';

export default class BrowserstackIndicatorExtractor extends BaseExtractor {
  public static override definitePatterns = [
    'window.chrome.runtime',
    'window.HTMLAnchorElement.prototype.hrefTranslate',
    'window.GPU.prototype.requestAdapter',
    'window.navigator.gpu.requestAdapter',
  ];

  public static override extraAddPatterns = ['window.navigator.languages'];
  public static override extraChangePatterns = [
    'window.navigator.languages.length',
    'window.GPU.prototype.requestAdapter',
    'window.navigator.gpu.requestAdapter',
  ];

  public static override ignoredExtraPatterns = [];

  public static override regexps = [
    /window.chrome$/,
    /window.chrome.runtime/,
    /window.HTMLAnchorElement.prototype.hrefTranslate/,
    /stack._\$value/,
  ];
}
