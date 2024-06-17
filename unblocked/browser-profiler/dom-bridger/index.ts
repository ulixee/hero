import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
import IDomPolyfill, {
  IDomPolyfillRemove,
} from '@ulixee/unblocked-specification/plugin/IDomPolyfill';
import { pathIsPatternMatch } from './lib/BridgeUtils';
import IBridgeDefinitions from './interfaces/IBridgeDefinitions';

const instanceVariations = BrowserProfiler.loadDataFile<IBridgeDefinitions>(
  'dom-bridges/path-patterns/instance-variations.json',
);
const locationVariations = BrowserProfiler.loadDataFile<IBridgeDefinitions>(
  'dom-bridges/path-patterns/location-variations.json',
);
const windowVariations = BrowserProfiler.loadDataFile<IBridgeDefinitions>(
  'dom-bridges/path-patterns/window-variations.json',
);
const devtoolsIndicators = BrowserProfiler.loadDataFile<IBridgeDefinitions>(
  'dom-bridges/path-patterns/devtools-indicators.json',
);
const headlessIndicators = BrowserProfiler.loadDataFile<IBridgeDefinitions>(
  'dom-bridges/path-patterns/headless-indicators.json',
);

export default class DomBridger {
  public static removeDevtoolsFromPolyfill(polyfill: IDomPolyfill): void {
    polyfill.add = polyfill.add.filter(x => !isDevtoolsIndicator(x.path, x.propertyName));
    polyfill.remove = polyfill.remove.filter(x => !isDevtoolsIndicator(x.path, x.propertyName));
    polyfill.modify = polyfill.modify.filter(x => !isDevtoolsIndicator(x.path, x.propertyName));

    injectDevtoolsIndicatorPolyfills(polyfill);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static removeBrowserstackFromPolyfill(polyfill: IDomPolyfill): void {
    // nothing to remove outside navigator, which is already being cut
  }

  public static removeHeadlessFromPolyfill(polyfill: IDomPolyfill): void {
    polyfill.add = polyfill.add.filter(x => !isHeadlessIndicator(x.path, x.propertyName));

    polyfill.remove = injectHeadlessIndicatorsToRemove(polyfill.remove);
  }

  public static removeVariationsFromPolyfill(polyfill: IDomPolyfill): void {
    polyfill.modify = polyfill.modify.filter(x => !isVariationChange(x.path, x.propertyName));
    polyfill.remove = polyfill.remove.filter(x => !isVariationChange(x.path, x.propertyName));
    polyfill.add = polyfill.add.filter(x => !isVariationChange(x.path, x.propertyName));
  }

  public static removeUnsupportedPropertiesFromPolyfill(polyfill: IDomPolyfill): void {
    polyfill.modify = polyfill.modify.filter(
      x => !isUnsupportedProperty(x.path, x.propertyName, x.property),
    );
    polyfill.remove = polyfill.remove.filter(
      x => !isUnsupportedProperty(x.path, x.propertyName, null),
    );
    polyfill.add = polyfill.add.filter(
      x => !isUnsupportedProperty(x.path, x.propertyName, x.property),
    );
  }
}

function isUnsupportedProperty(path: string, propertyName: string, property: any): boolean {
  if (property === 'Promise-like') {
    return true;
  }

  if (typeof property === 'string' && property.includes('but only 0 present')) {
    return true;
  }

  return false;
}

function isVariationChange(path: string, propertyName: string): boolean {
  const internalProperties = ['_$invocation', '_$value'];
  if (!internalProperties.includes(propertyName)) {
    path = `${path}.${propertyName}`;
  }
  if (instanceVariations.changed.some(pattern => pathIsPatternMatch(path, pattern))) return true;
  if (instanceVariations.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
    return true;
  if (locationVariations.changed.some(pattern => pathIsPatternMatch(path, pattern))) return true;
  if (locationVariations.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
    return true;
  if (windowVariations.changed.some(pattern => pathIsPatternMatch(path, pattern))) return true;
  if (windowVariations.extraChanged.some(pattern => pathIsPatternMatch(path, pattern))) return true;
  return false;
}

function isDevtoolsIndicator(path: string, propertyName: string): boolean {
  const internalProperties = ['_$invocation', '_$value'];
  if (!internalProperties.includes(propertyName)) {
    path = `${path}.${propertyName}`;
  }
  if (devtoolsIndicators.added.some(pattern => pathIsPatternMatch(path, pattern))) return true;
  if (devtoolsIndicators.extraAdded.some(pattern => pathIsPatternMatch(path, pattern))) return true;
  if (devtoolsIndicators.changed.some(pattern => pathIsPatternMatch(path, pattern))) return true;
  if (devtoolsIndicators.extraChanged.some(pattern => pathIsPatternMatch(path, pattern)))
    return true;
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isHeadlessIndicator(path: string, propertyName: string): boolean {
  if (headlessIndicators.added.some(pattern => pathIsPatternMatch(path, pattern))) return true;
  return false;
}

function injectDevtoolsIndicatorPolyfills(polyfill: IDomPolyfill): void {
  const toRemove = [...devtoolsIndicators.added, ...devtoolsIndicators.extraAdded];
  for (const fullPath of toRemove) {
    const pathParts = fullPath.split('.');
    const propertyName = pathParts.pop();
    polyfill.remove.push({
      path: pathParts.join('.'),
      propertyName,
    });
  }
}

function injectHeadlessIndicatorsToRemove(remove: IDomPolyfillRemove): IDomPolyfillRemove {
  const toRemove = [...headlessIndicators.added, ...headlessIndicators.extraAdded];
  for (const fullPath of toRemove) {
    const pathParts = fullPath.split('.');
    const propertyName = pathParts.pop();
    remove.push({
      path: pathParts.join('.'),
      propertyName,
    });
  }
  return remove;
}
