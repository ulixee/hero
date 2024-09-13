export function isOfficialHeader(key: string): boolean {
  const keyLower = key.toLowerCase();
  for (const prefix of officialHeaderPrefixes) {
    if (keyLower.startsWith(prefix)) return true;
  }
  return officialHeaderKeys.has(keyLower);
}

export function isOfficialDefaultValueKey(key: string): boolean {
  return officialDefaultValueKeys.has(key.toLowerCase());
}

/////// /////////

const officialHeaderPrefixes = [
  'sec-', // sec-fetch-mode, sec-fetch-site, sec-fetch-user, sec-origin-policy
  'proxy-', // proxy-authenticate, proxy-authorization, proxy-connection
  'access-control-',
];

const officialHeaderKeys = new Set([
  ':method',
  ':authority',
  ':scheme',
  ':path',
  'accept',
  'accept-charset',
  'accept-encoding',
  'accept-language',
  'accept-patch',
  'accept-ranges',
  'age',
  'allow',
  'alt-svc',
  'authorization',
  'cache-control',
  'connection',
  'content-disposition',
  'content-encoding',
  'content-language',
  'content-length',
  'content-location',
  'content-range',
  'content-type',
  'cookie',
  'date',
  'expect',
  'expires',
  'forwarded',
  'from',
  'host',
  'if-match',
  'if-modified-since',
  'if-none-match',
  'if-range',
  'if-unmodified-since',
  'last-modified',
  'location',
  'origin',
  'pragma',
  'public-key-pins',
  'range',
  'referer',
  'retry-after',
  'set-cookie',
  'strict-transport-security',
  'tk',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'upgrade-insecure-requests',
  'user-agent',
  'vary',
  'via',
  'warning',
  'www-authenticate',
]);

const officialDefaultValueKeys = new Set([
  'connection',
  'sec-fetch-site',
  'sec-fetch-mode',
  'sec-fetch-user',
  'sec-fetch-dest',
  'sec-ch-ua-mobile',
  'sec-ch-ua',
  'sec-ch-ua-platform',
  'sec-websocket-version',
  'sec-websocket-extensions',
  'accept',
  'accept-encoding',
  'accept-language', // Chrome headless will send en-US, while headed will send en-US,en;q=0.9 or en-US,en;q=0.9,und;q=0.8
  'upgrade',
  'upgrade-insecure-requests',
]);
