# DetachedElement

> DetachedElement is designed for parsing and traversing local HTML fragments without needing a browser engine. It's similar to Cheerio or JSDOM except that it's lighter weight and more W3C compliant.

This library is currently a thin wrapper for [linkedom](https://github.com/WebReflection/linkedom), which Hero uses under the hood when you call [hero.detach(element)](./hero.md#detach) or [element.$detach()](./awaited-dom-extensions.md#detach).
