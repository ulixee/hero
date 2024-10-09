import * as Helpers from './helpers';
import * as BrowserUtils from './browserUtils';
import TestLogger from './TestLogger';
import env from './env';

export { Helpers, BrowserUtils, TestLogger, env };

export const testIfNotOnGithubMac =
  process.env.CI === 'true' && process.platform === 'darwin' ? test.skip : test;

export const testIfNotOnGithubWindows =
  process.env.CI === 'true' && process.platform === 'win32' ? test.skip : test;
