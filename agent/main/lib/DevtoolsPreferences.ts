/**
 * Copyright (c) Microsoft Corporation.
 * Modifications copyright (c) Data Liberation Foundation Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import IDevtoolsSession, {
  Protocol,
} from '@ulixee/unblocked-specification/agent/browser/IDevtoolsSession';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import IBrowserEngine from '@ulixee/unblocked-specification/agent/browser/IBrowserEngine';
import { readFileAsJson } from '@ulixee/commons/lib/fileUtils';
import * as Fs from 'fs';
import * as Path from 'path';
import BindingCalledEvent = Protocol.Runtime.BindingCalledEvent;

const devtoolsPreferencesCallback = '_DevtoolsPreferencesCallback';

export default class DevtoolsPreferences {
  readonly preferencesPath: string;
  private cachedPreferences: any;

  constructor(browserEngine: IBrowserEngine) {
    bindFunctions(this);
    let browserDir = browserEngine.executablePath.split(browserEngine.fullVersion).shift();
    if (Fs.lstatSync(browserDir).isFile()) {
      browserDir = Path.dirname(browserDir);
    }

    this.preferencesPath = Path.join(browserDir, `devtoolsPreferences.json`);
  }

  public installOnConnect(session: IDevtoolsSession): Promise<void> {
    session.on('Runtime.bindingCalled', event => this.onPreferenceAction(session, event));

    return Promise.all([
      session.send('Runtime.enable'),
      session.send('Runtime.addBinding', { name: devtoolsPreferencesCallback }),
      session.send('Page.enable'),
      session.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `(function devtoolsPreferencesInterceptor() {
    const toIntercept = ['getPreferences', 'setPreference', 'removePreference', 'clearPreferences'].map(x => {
      return JSON.stringify({ method: x }).replace('{','').replace('}','').trim();
    });

    let inspector;
    Object.defineProperty(window, 'InspectorFrontendHost', {
      configurable: true,
      enumerable: true,
      get() { return inspector; },
      set(v) {
         inspector = v;
         // devtoolsHost is initiated when Inspector is created
         window.DevToolsHost.sendMessageToEmbedder = new Proxy(window.DevToolsHost.sendMessageToEmbedder, {
          apply(target, thisArg, args) {
            const json = args[0];
            for (const method of toIntercept) {
              if (json.includes(toIntercept)) {
                return window.${devtoolsPreferencesCallback}(json);
              }
            }
            return Reflect.apply(...arguments);
          }
         });
      },
    });
})()`,
      }),
      session.send('Runtime.runIfWaitingForDebugger'),
    ]).catch(() => null);
  }

  private async onPreferenceAction(
    session: IDevtoolsSession,
    event: BindingCalledEvent,
  ): Promise<void> {
    if (event.name !== devtoolsPreferencesCallback) return;

    const { id, method, params } = JSON.parse(event.payload);

    await this.load();

    let result;
    if (method === 'getPreferences') {
      result = this.cachedPreferences;
    } else {
      if (method === 'setPreference') {
        this.cachedPreferences[params[0]] = params[1];
      } else if (method === 'removePreference') {
        delete this.cachedPreferences[params[0]];
      } else if (method === 'clearPreferences') {
        this.cachedPreferences = {};
      }
      await this.save();
    }

    await session
      .send('Runtime.evaluate', {
        // built-in devtools function/api
        expression: `window.DevToolsAPI.embedderMessageAck(${id}, ${JSON.stringify(result)})`,
        contextId: event.executionContextId,
      })
      .catch(() => null);
  }

  private async save(): Promise<void> {
    await Fs.promises.writeFile(
      this.preferencesPath,
      JSON.stringify(this.cachedPreferences, null, 2),
      'utf8',
    );
  }

  private async load(): Promise<void> {
    if (this.cachedPreferences === undefined) {
      try {
        this.cachedPreferences = await readFileAsJson(this.preferencesPath);
      } catch (e) {
        this.cachedPreferences = {};
      }
    }
  }
}
