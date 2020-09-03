import fs from 'fs';
import Log from '@secret-agent/commons/Logger';
import { PageRecorderResultSet } from '@secret-agent/injected-scripts/scripts/pageEventsRecorder';
import { Page } from '@secret-agent/puppet-chrome/lib/Page';
import { IRegisteredEventListener, removeEventListeners } from '@secret-agent/commons/eventUtils';

const domObserver = fs.readFileSync(
  require.resolve('@secret-agent/injected-scripts/scripts/pageEventsRecorder.js'),
  'utf8',
);

const { log } = Log(module);

const runtimeFunction = '__saPageListenerCallback';

export default class DomRecorder {
  private readonly sessionId: string;
  private readonly puppetPage: Page;
  private onResults: (frameId: string, ...args: PageRecorderResultSet) => Promise<any>;

  private listeners: IRegisteredEventListener[] = [];

  constructor(
    sessionId: string,
    puppetPage: Page,
    onResults: (frameId: string, ...args: PageRecorderResultSet) => Promise<any>,
  ) {
    this.sessionId = sessionId;
    this.onResults = onResults;
    this.puppetPage = puppetPage;
    this.runtimeBindingCalled = this.runtimeBindingCalled.bind(this);
  }

  public async listen() {
    const callback = await this.puppetPage.frames.addPageCallback(
      runtimeFunction,
      this.runtimeBindingCalled.bind(this),
    );
    this.listeners.push(callback);

    await this.puppetPage.frames.addNewDocumentScript(
      `(function installDomRecorder(runtimeFunction) { \n\n ${domObserver.toString()} \n\n })('${runtimeFunction}');`,
    );
    // delete binding from every context also
    await this.puppetPage.frames.addNewDocumentScript(`delete window.${runtimeFunction}`, false);
  }

  public async setCommandIdForPage(commandId: number) {
    await this.puppetPage.frames.runInActiveFrames(`window.setCommandId(${commandId});`);
  }

  public async flush(closeAfterFlush = false) {
    const results = await this.puppetPage.frames.runInActiveFrames(`window.flushPageRecorder()`);
    if (!this.onResults) return;
    for (const [frameId, result] of Object.entries(results)) {
      if (result.value) {
        await this.onResults(frameId, ...(result.value as PageRecorderResultSet));
      }
    }
    if (closeAfterFlush) {
      this.onResults = null;
      removeEventListeners(this.listeners);
    }
  }

  private async runtimeBindingCalled(payload: string, frameId: string) {
    if (!frameId) {
      log.warn('DomRecorder.bindingCalledBeforeExecutionTracked', {
        sessionId: this.sessionId,
        payload,
      });
      return;
    }

    const result = JSON.parse(payload) as PageRecorderResultSet;

    await this.onResults(frameId, ...result);
  }
}
