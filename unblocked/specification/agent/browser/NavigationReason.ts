export type NavigationReason =
  | DevToolsNavigationReason
  | 'goto'
  | 'goBack'
  | 'goForward'
  | 'userGesture'
  | 'inPage'
  | 'newFrame';

type DevToolsNavigationReason =
  | 'formSubmissionGet'
  | 'formSubmissionPost'
  | 'httpHeaderRefresh'
  | 'scriptInitiated'
  | 'metaTagRefresh'
  | 'pageBlockInterstitial'
  | 'reload'
  | 'anchorClick';
