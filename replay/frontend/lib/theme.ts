import settings from './settings';
import { getTheme } from '~shared/utils/themes';

const theme = getTheme(settings.theme);

export default theme;
