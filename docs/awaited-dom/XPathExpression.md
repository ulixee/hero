# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> XPathExpression

<div class='overview'><span class="seoSummary">This interface is a compiled XPath expression that can be evaluated on a document or specific node to return information from its DOM tree.</span> This is useful when an expression will be reused in an application, because it is just compiled once and all namespace prefixes which occur within the expression are preresolved.</div>

<div class='overview'>Objects of this type are created by calling <code>XPathEvaluator.createExpression()</code>.</div>

## Methods

### .evaluate *(contextNode, type?, result?)* <div class="specs"><i>W3C</i></div> {#evaluate}

Evaluates the XPath expression on the given node or document.

#### **Arguments**:


 - contextNode [`Node`](/docs/awaited-dom/node). A <code>Node</code> representing the context to use for evaluating the expression.
 - type `number`. Specifies the type of result to be returned by evaluating the expression. This must be one of the <code>XPathResult.Constants</code>.
 - result [`XPathResult`](/docs/awaited-dom/x-path-result). Allows to specify a result object which may be reused and returned by this method. If this is specified as <code>null</code> or the implementation does not reuse the specified result, a new result object will be returned.

#### **Returns**: [`XPathResult`](/docs/awaited-dom/x-path-result)
