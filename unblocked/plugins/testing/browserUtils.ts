import ChromeEngine from '@ulixee/unblocked-agent/lib/ChromeEngine';

// eslint-disable-next-line import/no-dynamic-require
const ChromeApp = require(ChromeEngine.defaultPackageName);

export const defaultBrowserEngine = new ChromeEngine(new ChromeApp());
