import { nativeTheme } from 'electron';
import { lightTheme, darkTheme } from '~frontend/constants/themes';

export const getTheme = (name: string) => {
  if (name === 'secret-agent-light') return lightTheme;
  if (name === 'secret-agent-dark') return darkTheme;
  return nativeTheme.shouldUseDarkColors ? darkTheme : lightTheme;
};
