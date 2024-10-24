import { IPage } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IDevtoolsSession from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import IBrowserData from '../interfaces/IBrowserData';
import DomOverridesBuilder from './DomOverridesBuilder';
export default function setPageDomOverrides(domOverrides: DomOverridesBuilder, data: IBrowserData, pageOrFrame: IPage, devtoolsSession?: IDevtoolsSession): Promise<void>;
