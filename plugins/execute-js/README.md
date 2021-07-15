```
import Hero from '@ulixee/hero';
import ExecuteJsPlugin from '@ulixee/execute-js-plugin';

Hero.use(ExecuteJsPlugin);

(function run() {
    const hero = new Hero();
    await hero.goto('https://news.ycombinator.com');
    const title = await hero.executeJs(() => {
         return window.document.title;
    });
})();
```
