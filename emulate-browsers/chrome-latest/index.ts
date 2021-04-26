import * as Path from 'path';
import ChromeLatest from '@secret-agent/emulate-chrome-88';

const chromeLatestDir = Path.dirname(require.resolve('@secret-agent/emulate-chrome-88'));
export const chromeLatestDataDir = Path.join(chromeLatestDir, 'data');

export default ChromeLatest;
