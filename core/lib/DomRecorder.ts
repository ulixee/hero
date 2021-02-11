import * as fs from 'fs';
import Log from '@secret-agent/commons/Logger';
import { removeEventListeners } from '@secret-agent/commons/eventUtils';
import { IPuppetPage } from '@secret-agent/puppet-interfaces/IPuppetPage';
import IRegisteredEventListener from '@secret-agent/core-interfaces/IRegisteredEventListener';
import { PageRecorderResultSet } from '../injected-scripts/pageEventsRecorder';

const domObserver = fs.readFileSync(
  require.resolve('../injected-scripts/pageEventsRecorder.js'),
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
      `(function installDomRecorder(runtimeFunction) {
    const exports = {}; // workaround for ts adding an exports variable
    ${domObserver.toString()}
})('${runtimeFunction}');`,
      true,
    );
    // delete binding from every context also
    await this.puppetPage.addNewDocumentScript(`delete window.${runtimeFunction}`, false);
  }

  public async setCommandIdForPage(commandId: number) {
    const command = `window.commandId = ${commandId}`;
    await Promise.all(
      this.puppetPage.frames.map(x =>
        x.evaluate(command, true).catch(() => {
          // can fail when frames aren't ready. don't worry about it
        }),
      ),
    );
  }

  public async flush(closeAfterFlush = false) {
    if (!this.onResults) return;

    await Promise.all(
      this.puppetPage.frames.map(async frame => {
        // don't wait for env to be available
        if (!frame.canEvaluate(true)) return;
        try {
          const results = await frame.evaluate<PageRecorderResultSet>(
            `window.flushPageRecorder()`,
            true,
          );
          await this.onResults(frame.id, ...results);
        } catch (error) {
          // no op if it fails
        }
      }),
    );
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
