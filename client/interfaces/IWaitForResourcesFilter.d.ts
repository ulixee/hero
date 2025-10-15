import Resource from '../lib/Resource';
import IWaitForResourceFilter from './IWaitForResourceFilter';
export default interface IWaitForResourcesFilter extends Omit<IWaitForResourceFilter, 'filterFn'> {
    filterFn?: (resource: Resource, done: () => void) => Promise<boolean> | boolean;
}
