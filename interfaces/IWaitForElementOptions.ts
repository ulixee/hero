import IWaitForOptions from './IWaitForOptions';
import { INodeVisibilityAttribute } from './INodeVisibility';

export default interface IWaitForElementOptions extends IWaitForOptions {
  waitForVisible?: boolean;
  waitForHidden?: boolean;
  ignoreVisibilityAttributes?: INodeVisibilityAttribute[];
}
