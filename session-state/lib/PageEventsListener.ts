import fs from 'fs';
import Log from '@secret-agent/commons/Logger';
import IDevtoolsClient from '@secret-agent/core/interfaces/IDevtoolsClient';
import { PageRecorderResultSet } from '@secret-agent/injected-scripts/scripts/pageEventsRecorder';
import FrameTracker from '@secret-agent/core/lib/FrameTracker';
import DomEnv from '@secret-agent/core/lib/DomEnv';

const domObserver = fs.readFileSync(
  require.resolve('@secret-agent/injected-scripts/scripts/pageEventsRecorder.js'),
  'utf8',
);

const { log } = Log(module);

const runtimeFunction = '__saPageListenerCallback';

export default class PageEventsListener {
  public onNewContext?: (contextId: number) => Promise<any>;
  private readonly sessionId: string;
  private readonly devtoolsClient: IDevtoolsClient;
  private readonly frameTracker: FrameTracker;
  private onResults: (frameId: string, ...args: PageRecorderResultSet) => Promise<any>;

  constructor(
    sessionId: string,
    devtoolsClient: IDevtoolsClient,
    frameTracker: FrameTracker,
    onResults: (frameId: string, ...args: PageRecorderResultSet) => Promise<any>,
  ) {
    this.sessionId = sessionId;
    this.devtoolsClient = devtoolsClient;
    this.frameTracker = frameTracker;
    this.onResults = onResults;
    this.runtimeBindingCalled = this.runtimeBindingCalled.bind(this);
  }

  public async listen() {
    // add binding to every new context automatically
    await this.devtoolsClient.send('Runtime.addBinding', {
      name: runtimeFunction,
    });
    await this.devtoolsClient.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(function installPageEventsListener(runtimeFunction) { \n\n ${domObserver.toString()} \n\n })('${runtimeFunction}');`,
      worldName: DomEnv.installedDomWorldName,
    });
    // delete binding from every context also
    await this.devtoolsClient.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `delete window.${runtimeFunction}`,
    });

    await this.devtoolsClient.on('Runtime.bindingCalled', this.runtimeBindingCalled);
  }

  public async setCommandIdForPage(commandId: number) {
    await this.frameTracker.runInActiveFrames(
      `window.setCommandId(${commandId});`,
      DomEnv.installedDomWorldName,
    );
  }

  public async setCommandIdInContext(commandId: number, contextId: number) {
    await this.devtoolsClient
      .send('Runtime.evaluate', {
        expression: `window.setCommandId(${commandId});`,
        contextId,
        returnByValue: true,
      })
      .catch(error =>
        log.warn('NewContext.setCommandIdError', { sessionId: this.sessionId, error }),
      );
  }

  public async flush(closeAfterFlush = false) {
    const results = await this.frameTracker.runInActiveFrames(
      `window.flushPageRecorder()`,
      DomEnv.installedDomWorldName,
    );
    if (!this.onResults) return;
    for (const [frameId, result] of Object.entries(results)) {
      if (result.value) {
        await this.onResults(frameId, ...(result.value as PageRecorderResultSet));
      }
    }
    if (closeAfterFlush) {
      this.onResults = null;
      this.devtoolsClient.off('Runtime.bindingCalled', this.runtimeBindingCalled);
    }
  }

  private async runtimeBindingCalled({ name, payload, executionContextId }) {
    if (name !== runtimeFunction) return;
    const frameId = this.frameTracker.getFrameIdForExecutionContext(executionContextId);
    if (!frameId) {
      log.warn('PageEventsListener.bindingCalledBeforeExecutionTracked', {
        sessionId: this.sessionId,
        executionContextId,
        name,
        payload,
      });
      return;
    }

    const result = JSON.parse(payload) as PageRecorderResultSet;

    await this.onResults(frameId, ...result);
  }
}
