import BaseExtractor from './BaseExtractor';

export default class HeadlessIndicatorExtractor extends BaseExtractor {
  public static override definitePatterns = [
    'window.navigator.languages',
    'window.navigator.plugins',
    'window.navigator.mimeTypes',
    'window.HTMLLinkElement.prototype.import',
  ];

  public static override extraAddPatterns = [];
  public static override extraChangePatterns = [];

  public static override ignoredExtraPatterns = [];

  public static override regexps = [
    /window.HTMLLinkElement.prototype.import/
  ];
}
