import Frame from './Frame';
import Page from './Page';
import DevtoolsSession from './DevtoolsSession';
export default class FrameOutOfProcess {
    page: Page;
    frame: Frame;
    devtoolsSession: DevtoolsSession;
    private networkManager;
    private domStorageTracker;
    private get browserContext();
    constructor(page: Page, frame: Frame);
    initialize(): Promise<void>;
}
