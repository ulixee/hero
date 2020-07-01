# CSSStyleDeclaration

<div class='overview'>The <strong><code>CSSStyleDeclaration</code></strong> interface represents an object that is a CSS declaration block, and exposes style information and various style-related methods and properties.</div>

<div class='overview'>A <code>CSSStyleDeclaration</code> object can be exposed using three different APIs:</div>

## Properties

### .cssFloat <div class="specs"><i>W3C</i></div> {#cssFloat}

The cssFloat attribute can be set for elements that generate boxes that are not absolutely positioned. The cssFloat attribute corresponds to the float Cascading Style Sheets (CSS) property. Getting this attribute is equivalent to calling the getProperty method. Setting this attribute is equivalent to calling the setProperty method.

#### **Type**: `SuperDocument`

### .cssText <div class="specs"><i>W3C</i></div> {#cssText}

Textual representation of the declaration block. Setting this attribute changes the style.

#### **Type**: `SuperDocument`

### .length <div class="specs"><i>W3C</i></div> {#length}

The number of properties. See the <a href="/en-US/docs/Web/API/CSSStyleDeclaration/item" title="The CSSStyleDeclaration.item() method interface returns a CSS property name from a CSSStyleDeclaration by index"><code>item()</code></a> method below.

#### **Type**: `SuperDocument`

### .parentRule <div class="specs"><i>W3C</i></div> {#parentRule}

The containing <a href="/en-US/docs/Web/API/CSSRule" title="The CSSRule interface represents a single CSS rule. There are several types of rules, listed in the Type constants section below."><code>CSSRule</code></a>.

#### **Type**: `SuperDocument`

## Methods

### .getPropertyPriority*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getPropertyPriority}

Returns the optional priority, "important".

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getPropertyValue*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getPropertyValue}

Returns the property value given a property name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .item*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#item}

Returns a property name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .removeProperty*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#removeProperty}

Removes a property from the CSS declaration block.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setProperty*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setProperty}

Modifies an existing CSS property or creates a new CSS property in the declaration block.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
