# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> XPathEvaluatorBase

<div class='overview'>The&nbsp;<code>XPathEvaluator</code> interface allows to compile and evaluate XPath expressions.</div>

<div class='overview'>It is implemented by the <code>Document</code> interface.</div>

## Methods

### .createExpression *(expression, resolver?)* <div class="specs"><i>W3C</i></div> {#createExpression}

Creates a parsed XPath expression with resolved namespaces.

#### **Arguments**:


 - expression `string`. A `string` representing representing the XPath expression to be created.
 - resolver [`XPathNSResolver`](./xpath-ns-resolver.md). Permits translation of all prefixes, including the <code>xml</code> namespace prefix, within the XPath expression into appropriate namespace URIs.

#### **Returns**: [`XPathExpression`](./xpath-expression.md)

### .evaluate *(expression, contextNode, resolver?, type?, result?)* <div class="specs"><i>W3C</i></div> {#evaluate}

Evaluates an XPath expression string and returns a result of the specified type if possible.

#### **Arguments**:


 - expression `string`. A `string` representing the XPath expression to be parsed and evaluated.
 - contextNode [`Node`](./node.md). A <code>Node</code> representing the context to use for evaluating the expression.
 - resolver [`XPathNSResolver`](./xpath-ns-resolver.md). Permits translation of all prefixes, including the <code>xml</code> namespace prefix, within the XPath expression into appropriate namespace URIs.
 - type `number`. Specifies the type of result to be returned by evaluating the expression. This must be one of the <code>XPathResult.Constants</code>.
 - result [`XPathResult`](./xpath-result.md). Allows to specify a result object which may be reused and returned by this method. If this is specified as <code>null</code> or the implementation does not reuse the specified result, a new result object will be returned.

#### **Returns**: [`XPathResult`](./xpath-result.md)

## Unimplemented Specs

#### Methods

|     |     |
| --- | --- |
| `createNSResolver()` |  |
