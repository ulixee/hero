"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Console = void 0;
// Currently this only used to support communication from chrome (injected scripts) to unblocked agent
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const TypedEventEmitter_1 = require("@ulixee/commons/lib/TypedEventEmitter");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const SCRIPT_PLACEHOLDER = '';
class Console extends TypedEventEmitter_1.default {
    constructor(devtoolsSession, secretKey) {
        super();
        this.devtoolsSession = devtoolsSession;
        this.secretKey = secretKey;
        this.events = new EventSubscriber_1.default();
        // We store resolvable when we received websocket message before, receiving
        // targetId, this way we can await this, and still trigger to get proper ids.
        this.clientIdToTargetId = new Map();
    }
    async initialize() {
        if (this.isReady)
            return this.isReady.promise;
        this.isReady = new Resolvable_1.default();
        await this.devtoolsSession.send('Console.enable');
        this.events.on(this.devtoolsSession, 'Console.messageAdded', this.handleConsoleMessage.bind(this));
        this.isReady.resolve();
        return this.isReady.promise;
    }
    isConsoleRegisterUrl(url) {
        return url.includes(`hero.localhost/?secretKey=${this.secretKey}&action=registerConsoleClientId&clientId=`);
    }
    registerFrameId(url, frameId) {
        const parsed = new URL(url);
        const clientId = parsed.searchParams.get('clientId');
        if (!clientId)
            return;
        const targetId = this.clientIdToTargetId.get(clientId);
        if (targetId instanceof Resolvable_1.default) {
            targetId.resolve(frameId);
        }
        this.clientIdToTargetId.set(clientId, frameId);
    }
    injectCallbackIntoScript(script) {
        // We could do this as a simple template script but this logic might get
        // complex over time and we want typescript to be able to check proxyScript();
        const scriptFn = injectedScript
            .toString()
            // eslint-disable-next-line no-template-curly-in-string
            .replaceAll('${this.secretKey}', this.secretKey)
            // Use function otherwise replace will try todo some magic
            .replace('SCRIPT_PLACEHOLDER', () => script);
        const wsScript = `(${scriptFn})();`;
        return wsScript;
    }
    async handleConsoleMessage(msgAdded) {
        if (msgAdded.message.source !== 'console-api' || msgAdded.message.level !== 'debug')
            return;
        let clientId;
        let name;
        let payload;
        try {
            // Doing this is much much cheaper than json parse on everything logged in console debug
            const text = msgAdded.message.text;
            const [secret, maybeClientId, serializedData] = [
                text.slice(6, 27),
                text.slice(29, 39),
                text.slice(41),
            ];
            if (secret !== this.secretKey)
                return;
            const data = JSON.parse(serializedData);
            name = data.name;
            payload = data.payload;
            clientId = maybeClientId;
        }
        catch {
            return;
        }
        let frameId = this.clientIdToTargetId.get(clientId);
        if (!frameId) {
            const resolvable = new Resolvable_1.default();
            this.clientIdToTargetId.set(clientId, resolvable);
            frameId = await resolvable.promise;
        }
        else if (frameId instanceof Resolvable_1.default) {
            frameId = await frameId.promise;
        }
        this.emit('callback-received', { id: frameId, name, payload });
    }
}
exports.Console = Console;
/** This function will be stringified and inserted as a wrapper script so all injected
 * scripts have access to a callback function (over a websocket). This function takes
 * care of setting up that websocket and all other logic it needs as glue to make it all work.
 * */
function injectedScript() {
    const clientId = Math.random().toString().slice(2, 12);
    // This will signal to network manager we are trying to make websocket connection
    // This is needed later to map clientId to frameId
    const scheme = location.href.startsWith('chrome://') ? 'data' : 'http';
    const url = `${scheme}://hero.localhost/?secretKey=${this.secretKey}&action=registerConsoleClientId&clientId=${clientId}`;
    if (scheme === 'data') {
        // eslint-disable-next-line no-console
        console.info('Using fetch with data:// scheme, http:// not supported inside chrome:// urls, ignore fetch errors including data:// scheme');
    }
    void fetch(url, { mode: 'no-cors' }).catch(() => undefined);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const callback = (name, payload) => {
        const serializedData = JSON.stringify({ name, payload });
        // eslint-disable-next-line no-console
        console.debug(`hero: ${this.secretKey}, ${clientId}, ${serializedData}`);
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    SCRIPT_PLACEHOLDER;
}
//# sourceMappingURL=Console.js.map