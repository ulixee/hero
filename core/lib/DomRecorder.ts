import fs from 'fs';
import Log from '@secret-agent/commons/Logger';
import { PageRecorderResultSet } from '@secret-agent/injected-scripts/scripts/pageEventsRecorder';
import { IRegisteredEventListener, removeEventListeners } from '@secret-agent/commons/eventUtils';
import { IPuppetPage } from '@secret-agent/puppet/interfaces/IPuppetPage';

const domObserver = fs.readFileSync(
  require.resolve('@secret-agent/injected-scripts/scripts/pageEventsRecorder.js'),
  'utf8',
);

const { log } = Log(module);

const runtimeFunction = '__saPageListenerCallback';

export default class DomRecorder {
  private readonly sessionId: string;
  private readonly puppetPage: IPuppetPage;
  private onResults: (frameId: string, ...args: PageRecorderResultSet) => Promise<any>;

  private listeners: IRegisteredEventListener[] = [];

  constructor(
    sessionId: string,
    puppetPage: IPuppetPage,
    onResults: (frameId: string, ...args: PageRecorderResultSet) => Promise<any>,
  ) {
    this.sessionId = sessionId;
    this.onResults = onResults;
    this.puppetPage = puppetPage;
    this.runtimeBindingCalled = this.runtimeBindingCalled.bind(this);
  }

  public async install() {
    const callback = await this.puppetPage.addPageCallback(
      runtimeFunction,
      this.runtimeBindingCalled.bind(this),
    );
    this.listeners.push(callback);

    await this.puppetPage.addNewDocumentScript(
      `(function installDomRecorder(runtimeFunction) { \n\n ${domObserver.toString()} \n\n })('${runtimeFunction}');`,
      true,
    );
    // delete binding from every context also
    await this.puppetPage.addNewDocumentScript(`delete window.${runtimeFunction}`, false);
  }

  public async setCommandIdForPage(commandId: number) {
    await this.puppetPage.runInFrames(`window.setCommandId(${commandId});`, true);
  }

  public async flush(closeAfterFlush = false) {
    const results = await this.puppetPage.runInFrames<any>(`window.flushPageRecorder()`, true);
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
