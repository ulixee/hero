# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> CSSStyleDeclaration

<div class='overview'>The <strong><code>CSSStyleDeclaration</code></strong> interface represents an object that is a CSS declaration block, and exposes style information and various style-related methods and properties.</div>

<div class='overview'>A <code>CSSStyleDeclaration</code> object can be exposed using three different APIs:</div>

## Properties

### .cssFloat <div class="specs"><i>W3C</i></div> {#cssFloat}

The cssFloat attribute can be set for elements that generate boxes that are not absolutely positioned. The cssFloat attribute corresponds to the float Cascading Style Sheets (CSS) property. Getting this attribute is equivalent to calling the getProperty method. Setting this attribute is equivalent to calling the setProperty method.

#### **Type**: `Promise<string>`

### .cssText <div class="specs"><i>W3C</i></div> {#cssText}

Textual representation of the declaration block. Setting this attribute changes the style.

#### **Type**: `Promise<string>`

### .length <div class="specs"><i>W3C</i></div> {#length}

The number of properties. See the <code>item()</code> method below.

#### **Type**: `Promise<number>`

### .parentRule <div class="specs"><i>W3C</i></div> {#parentRule}

The containing <code>CSSRule</code>.

#### **Type**: [`CSSRule`](/docs/awaited-dom/css-rule)

## Methods

### .getPropertyPriority *(property)* <div class="specs"><i>W3C</i></div> {#getPropertyPriority}

Returns the optional priority, "important".

#### **Arguments**:


 - property `string`. *<code>property</code>*&nbsp;is a `string`&nbsp;representing the property name to be checked.

#### **Returns**: `Promise<string>`

### .getPropertyValue *(property)* <div class="specs"><i>W3C</i></div> {#getPropertyValue}

Returns the property value given a property name.

#### **Arguments**:


 - property `string`. *<code>property</code>*&nbsp;is a `string`&nbsp;representing the property name&nbsp;(hyphen case) to be checked.

#### **Returns**: `Promise<string>`

### .item *(index)* <div class="specs"><i>W3C</i></div> {#item}

Returns a property name.

#### **Arguments**:


 - index `number`. *<code>index</code>* is the index of the node to be fetched. The index is zero-based.

#### **Returns**: `Promise<string>`

### .removeProperty *(property)* <div class="specs"><i>W3C</i></div> {#removeProperty}

Removes a property from the CSS declaration block.

#### **Arguments**:


 - property `string`. *<code>property</code>*&nbsp;is a `string`&nbsp;representing the property name to be removed. Note that multi-word property names are hyphenated and not camel-cased.

#### **Returns**: `Promise<string>`

### .setProperty *(property, value, priority?)* <div class="specs"><i>W3C</i></div> {#setProperty}

Modifies an existing CSS property or creates a new CSS property in the declaration block.

#### **Arguments**:


 - property `string`. *<code>propertyName</code>*&nbsp;is a `string`&nbsp;representing the CSS property name (hyphen case) to be modified.
 - value `string`. *<code>value</code>*&nbsp;<span class="inlineIndicator optional optionalInline">Optional</span> is a `string`&nbsp;containing the new property value. If not specified, treated as the empty string.
      <ul>
       <li>Note:&nbsp;*<code>value</code>*&nbsp;must not contain&nbsp;<code>"!important"</code>&nbsp;-- that should be set using the *<code>priority</code>* parameter.</li>
      </ul>
 - priority `string`. *<code>priority</code>* <span class="inlineIndicator optional optionalInline">Optional</span> is a `string`&nbsp;allowing the "important" CSS priority to be set. If not specified, treated as the empty string. The following values are accepted:
      <ul>
       <li>String value <code>"important"</code></li>
       <li>Keyword <code>undefined</code></li>
       <li>String empty value <code>""</code></li>
      </ul>

#### **Returns**: `Promise<void>`
