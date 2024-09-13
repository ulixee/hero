export type NavigationReason =
  | DevToolsNavigationReason
  | 'goto'
  | 'goBack'
  | 'goForward'
  | 'goForwardOrBack'
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
