"use strict";
// NOTE: You need to start a Ulixee Cloud to run this example
Object.defineProperty(exports, "__esModule", { value: true });
const hero_1 = require("@ulixee/hero");
const Fs = require("fs");
const sessionIdPath = `${__dirname}/previousSession.txt`;
const resumeSessionId = Fs.existsSync(sessionIdPath)
    ? Fs.readFileSync(sessionIdPath, 'utf8')
    : undefined;
(async () => {
    const hero = new hero_1.default({
        showChromeInteractions: true, // disable to remove mouse movements and node highlights (can be detected by page!)
        showChrome: true,
        sessionKeepAlive: true,
        resumeSessionId,
        resumeSessionStartLocation: 'currentLocation', // 'currentLocation | pageStart', // default: currentLocation
    });
    const sessionId = await hero.sessionId;
    Fs.writeFileSync(sessionIdPath, sessionId);
    await hero.goto('https://ulixee.org');
    await hero.waitForPaintingStable();
    await hero.click(hero.document.querySelector('h1'));
    await hero.click(hero.document.querySelector('.search-form  input'));
    // Uncomment one by one to see changes load
    // await hero.type('flightss');
    //
    // await hero.interact({ click: hero.document.querySelectorAll('.datasets .description')[4] });
    //
    // await hero.waitForLocation('change');
    // await hero.waitForPaintingStable();
    //
    // await hero.interact({ click: hero.document.querySelector('.related-datasets a') });
    //
    // await hero.click(hero.document.querySelector('a[href="/pricing"]'));
    await hero.close();
})();
//# sourceMappingURL=sessionResume.js.map