# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> SVGAnimatedTransformList

<div class='overview'>The <code>SVGAnimatedTransformList</code> interface is used for attributes which take a list of numbers and which can be animated.</div>

## Properties

### .animVal <div class="specs"><i>W3C</i></div> {#animVal}

A read only <a href="/en-US/docs/Web/API/SVGTransformList" title="The SVGTransformList defines a list of SVGTransform objects."><code>SVGTransformList</code></a> representing the current animated value of the given attribute. If the given attribute is not currently being animated, then the <a href="/en-US/docs/Web/API/SVGTransformList" title="The SVGTransformList defines a list of SVGTransform objects."><code>SVGTransformList</code></a> will have the same contents as <code>baseVal</code>. The object referenced by <code>animVal</code> will always be distinct from the one referenced by <code>baseVal
</code>, even when the attribute is not animated.

#### **Type**: `null`

### .baseVal <div class="specs"><i>W3C</i></div> {#baseVal}

The base value of the given attribute before applying any animations.

#### **Type**: `null`
