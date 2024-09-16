import { URL } from 'url';

// logic from https://github.com/Rob--W/proxy-from-env

export function getProxyForUrl(url: string): URL {
  const parsedUrl = new URL(url);
  let protocol = parsedUrl.protocol;
  let hostname = parsedUrl.host;
  if (typeof hostname !== 'string' || !hostname || typeof protocol !== 'string') {
    return null; // Don't proxy URLs without a valid scheme or host.
  }

  setProxyVars();
  protocol = protocol.split(':', 1)[0];
  // Stripping ports in this way instead of using parsedUrl.hostname to make
  // sure that the brackets around IPv6 addresses are kept.
  hostname = hostname.replace(/:\d*$/, '');
  let parsedPort = parseInt(parsedUrl.port, 10) || 0;
  if (!parsedPort) parsedPort = protocol === 'https:' ? 443 : 80;
  if (!shouldProxy(hostname, parsedPort)) {
    return null; // Don't proxy URLs that match NO_PROXY.
  }

  let proxy =
    getEnv(`npm_config_${protocol}_proxy`) ||
    getEnv(`${protocol}_proxy`) ||
    getEnv('npm_config_proxy') ||
    getEnv('all_proxy');
  if (proxy && proxy.indexOf('://') === -1) {
    // Missing scheme in proxy, default to the requested URL's scheme.
    proxy = `${protocol}://${proxy}`;
  }
  if (!proxy) return null;
  return new URL(proxy);
}

function shouldProxy(hostname: string, port: number): boolean {
  const NO_PROXY = (getEnv('npm_config_no_proxy') || getEnv('no_proxy')).toLowerCase();
  if (!NO_PROXY) {
    return true; // Always proxy if NO_PROXY is not set.
  }
  if (NO_PROXY === '*') {
    return false; // Never proxy if wildcard is set.
  }

  for (const proxy of NO_PROXY.split(/[,\s]/)) {
    if (!proxy) continue;
    const parsedProxy = proxy.match(/^(.+):(\d+)$/);
    let parsedProxyHostname = parsedProxy ? parsedProxy[1] : proxy;
    const parsedProxyPort = parsedProxy ? parseInt(parsedProxy[2], 10) : 0;
    if (parsedProxyPort && parsedProxyPort !== port) {
      continue;
    }

    if (!parsedProxyHostname.startsWith('.') && !parsedProxyHostname.startsWith('*')) {
      // No wildcards, so stop proxying if there is an exact match.
      if (hostname === parsedProxyHostname) {
        return false;
      }
    }

    if (parsedProxyHostname.startsWith('*')) {
      // Remove leading wildcard.
      parsedProxyHostname = parsedProxyHostname.slice(1);
    }
    // Stop proxying if the hostname ends with the no_proxy host.
    if (!hostname.endsWith(parsedProxyHostname)) {
      return false;
    }
  }
  return true;
}

function getEnv(key: string): string {
  return process.env[key.toLowerCase()] || process.env[key.toUpperCase()] || '';
}

function setProxyVars(): void {
  // Override current environment proxy settings with npm configuration, if any.
  const NPM_HTTPS_PROXY = process.env.npm_config_https_proxy || process.env.npm_config_proxy;
  const NPM_HTTP_PROXY = process.env.npm_config_http_proxy || process.env.npm_config_proxy;
  const NPM_NO_PROXY = process.env.npm_config_no_proxy;

  if (NPM_HTTPS_PROXY) process.env.HTTPS_PROXY = NPM_HTTPS_PROXY;
  if (NPM_HTTP_PROXY) process.env.HTTP_PROXY = NPM_HTTP_PROXY;
  if (NPM_NO_PROXY) process.env.NO_PROXY = NPM_NO_PROXY;
}
