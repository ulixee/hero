import BaseExtractor from './BaseExtractor';

export default class DevtoolsIndicatorExtractor extends BaseExtractor {
  public static override definitePatterns = [
    'window.Element.prototype.createShadowRoot',
    'window.Document.prototype.registerElement',
    'window.Text.prototype.getDestinationInsertionPoints',
    'window.Element.prototype.getDestinationInsertionPoints',
    'detached.clearStale',
    'detached.isNodeReachable_',
  ];

  public static override extraAddPatterns = [
    'window.document.$cdc_asdjflasutopfhvcZLmcfl_',
    `*.getDestinationInsertionPoints`,
    'window.cdc_adoQpoasnfa76pfcZLmcfl',
    'window.Element.prototype.createShadowRoot',
  ];

  public static override extraChangePatterns = ['window.navigator.userActivation','window.navigator.webdriver'];

  public static override ignoredExtraPatterns = [];

  public static override regexps = [
    /window.navigator.userActivation.+/, // indicates user has done some activity
    /window.find/, // this seems to be returning true on webdriver, but not in a real browser

    /window.document.\$cdc_asdjflasutopfhvcZLmcfl_/,
    /window.cdc_adoQpoasnfa76pfcZLmcfl_/,
    /.getDestinationInsertionPoints/,

    /window.navigator.webdriver.*/,
    /window.Navigator.prototype.webdriver/,
    /window.Element.prototype.createShadowRoot/,
    /window.Document.prototype.registerElement/,

    // TODO: what are these?
    /detached.clearStale/,
    /detached.isNodeReachable_/,
  ];
}
