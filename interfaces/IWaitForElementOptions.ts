import IWaitForOptions from './IWaitForOptions';
import { INodeVisibilityOptions } from './INodeVisibility';

export default interface IWaitForElementOptions extends IWaitForOptions {
  waitForVisible?: boolean | Omit<INodeVisibilityOptions, 'nodeExists'>;
}
