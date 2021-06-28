import Window from '~backend/models/Window';
import Application from '~backend/Application';
import ViewBackend from '~backend/models/ViewBackend';
import ReplayView from '~backend/models/ReplayView';

export default class OutputView extends ViewBackend {
  private readonly isReady: Promise<void>;
  private replayView: ReplayView;

  constructor(window: Window, replayView: ReplayView) {
    super(window, {
      sandbox: false,
      nodeIntegration: true,
      enableRemoteModule: true,
    });
    this.replayView = replayView;
    this.browserView.setAutoResize({
      width: true,
      height: true,
      horizontal: false,
      vertical: true,
    });

    const url = Application.instance.getPageUrl('output');
    this.isReady = this.browserView.webContents.loadURL(url);
  }

  public clear() {
    this.browserView.webContents.send('set:output', null);
  }

  public setCommandId(commandId: number) {
    const lastOutput = this.replayView.replayApi.output.getLatestOutput(commandId);
    if (lastOutput) {
      this.browserView.webContents.send(
        'set:output',
        lastOutput.output,
        lastOutput.bytes,
        lastOutput.changes,
      );
    }
  }
}
