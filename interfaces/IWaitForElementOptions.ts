import IWaitForOptions from './IWaitForOptions';

export default interface IWaitForElementOptions extends IWaitForOptions {
  waitForVisible?: boolean;
  waitForClickable?: boolean;
  waitForHidden?: boolean;
}
