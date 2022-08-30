```
import HeroCore from '@ulixee/hero-core';
import Hero from '@ulixee/hero';
import ExecuteJsPlugin from '@ulixee/execute-js-plugin';

HeroCore.use(ExecuteJsPlugin);

(function run() {
    const hero = new Hero();
    hero.use(ExecuteJsPlugin);
    await hero.goto('https://news.ycombinator.com');
    const title = await hero.executeJs(() => {
         return window.document.title;
    });
})();
```
