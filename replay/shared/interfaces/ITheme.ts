export default interface ITheme {
  titlebarBackgroundColor: string;

  addressBarBackgroundColor: string;
  addressBarTextColor: string;

  toolbarBackgroundColor: string;
  toolbarBottomLineBackgroundColor: string;
  toolbarLightForeground: boolean;
  toolbarSeparatorColor: string;

  tabTextColor: string;
  tabSelectedTextColor: string;

  controlBackgroundColor: string;
  controlHoverBackgroundColor: string;
  controlValueColor: string;
  controlLightIcon: boolean;
  switchBackgroundColor: string;

  dialogSeparatorColor: string;
  dialogBackgroundColor: string;
  dialogTextColor: string;
  dialogLightForeground: boolean;

  pagesBackgroundColor: string;
  pagesLightForeground: boolean;
  pagesTextColor: string;
  pagesNavigationDrawerBackgroundColor: string;

  dropdownSeparatorColor: string;
  dropdownBackgroundColor: string;
  dropdownBackgroundColorTranslucent: string;

  backgroundColor: string;
  accentColor: string;

  titlebarHeight?: number;
  tabHeight?: number;
  tabMarginTop?: number;

  dark?: boolean;
}
