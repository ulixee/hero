import IBrowser from '../interfaces/IBrowser';
import extractUserAgentMeta from './extractUserAgentMeta';

export function createBrowserId(browser: Pick<IBrowser, 'name' | 'version'>): string {
  const name = browser.name.toLowerCase().replace(/\s/g, '-');
  const minorVersion = name === 'edge' ? '0' : browser.version.minor;
  return `${name}-${browser.version.major}-${minorVersion}`;
}

export function createBrowserIdFromUserAgentString(userAgentString: string): string {
  const { name, version } = extractUserAgentMeta(userAgentString);
  return createBrowserId({ name, version });
}
