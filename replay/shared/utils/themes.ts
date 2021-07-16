import { nativeTheme } from 'electron';
import { lightTheme, darkTheme } from '~frontend/constants/themes';

export const getTheme = (name: string) => {
  if (name === 'ulixee-light') return lightTheme;
  if (name === 'ulixee-dark') return darkTheme;
  return nativeTheme?.shouldUseDarkColors ? darkTheme : lightTheme;
};
