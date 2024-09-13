import BaseExtractor from './BaseExtractor';

export default class BrowserstackIndicatorExtractor extends BaseExtractor {
  public static override definitePatterns = [
    'window.chrome.runtime',
    'window.HTMLAnchorElement.prototype.hrefTranslate',
  ];

  public static override extraAddPatterns = [];
  public static override extraChangePatterns = [];

  public static override ignoredExtraPatterns = [];

  public static override regexps = [
    /window.chrome$/,
    /window.chrome.runtime/,
    /window.HTMLAnchorElement.prototype.hrefTranslate/,
    /stack._\$value/,
  ];
}
