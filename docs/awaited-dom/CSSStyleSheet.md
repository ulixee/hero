# [AwaitedDOM](/docs/hero/basic-client/awaited-dom) <span>/</span> CSSStyleSheet

<div class='overview'><span class="seoSummary">The <strong><code>CSSStyleSheet</code></strong> interface represents a single CSS stylesheet, and lets you inspect and modify the list of rules contained in the stylesheet.</span> It inherits properties and methods from its parent, <code>StyleSheet</code>.</div>

<div class='overview'>A stylesheet consists of a collection of <code>CSSRule</code> objects representing each of the rules in the stylesheet. The rules are contained in a <code>CSSRuleList</code>, which can be obtained from the stylesheet's <code>cssRules</code> property.</div>

<div class='overview'>For example, one rule might be a <code>CSSStyleRule</code> object containing a style such as:</div>

## Properties

### .cssRules <div class="specs"><i>W3C</i></div> {#cssRules}


 <p>Returns a live <code>CSSRuleList</code> which maintains an up-to-date list of the <code>CSSRule</code> objects that comprise the stylesheet.</p>
 <p>This is normally used to access individual rules like this:</p>
 <pre><code>styleSheet.cssRules[i] // where i = 0..cssRules.length-1</code></pre>
 <p>To add or remove items in <code>cssRules</code>, use the&nbsp;<code>CSSStyleSheet</code>'s <code>insertRule()</code> and <code>deleteRule()</code> methods.</p>
 

#### **Type**: [`CSSRuleList`](/docs/hero/awaited-dom/css-rule-list)

### .ownerRule <div class="specs"><i>W3C</i></div> {#ownerRule}

If this stylesheet is imported into the document using an <code>@import</code> rule, the <code>ownerRule</code> property returns the corresponding <code>CSSImportRule</code>; otherwise, this property's value is <code>null</code>.

#### **Type**: [`CSSRule`](/docs/hero/awaited-dom/css-rule)

## Methods

### .deleteRule *(index)* <div class="specs"><i>W3C</i></div> {#deleteRule}

Deletes the rule at the specified index into the stylesheet's rule list.

#### **Arguments**:


 - index `number`. The index into the stylesheet's <code>CSSRuleList</code> indicating the rule to be removed.

#### **Returns**: `Promise<void>`

### .insertRule *(rule, index?)* <div class="specs"><i>W3C</i></div> {#insertRule}

Inserts a new rule at the specified position in the stylesheet, given the textual representation of the rule.

#### **Arguments**:


 - rule `string`. <p>A `string` containing the rule to be inserted. What the inserted rule must contain depends on its type:</p>
     <ul>
      <li>**For rule-sets**, both a selector and a style declaration.</li>
      <li>**For at-rules**, both an at-identifier and the rule content.</li>
     </ul>
 - index `number`. A positive integer less than or equal to <code>stylesheet.cssRules.length</code>, representing the newly inserted rule's position in <code>CSSStyleSheet.cssRules</code>. The default is <code>0</code>. (In older implementations, this was required. See <a href="#Browser_compatibility">Browser compatibility</a> for details.)

#### **Returns**: `Promise<number>`

## Unimplemented Specs

#### Properties

|     |     |
| --- | --- |
| `disabled` | `href` |
| `media` | `ownerNode` |
| `parentStyleSheet` | `title` |
| `type` |  |
