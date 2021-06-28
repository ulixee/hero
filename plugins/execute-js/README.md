```
import agent from 'secret-agent';
import ExecuteJsPlugin from '@secret-agent/execute-js-plugin';

agent.use(ExecuteJsPlugin);

(function run() {
    await agent.goto('https://news.ycombinator.com');
    const title = await agent.executeJs(() => {
         return window.document.title;
    });
})();
```
