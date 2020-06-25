# SVGAnimatedTransformList

<div class='overview'>The <code>SVGAnimatedTransformList</code> interface is used for attributes which take a list of numbers and which can be animated.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">animVal</a>
    <div>A read only <a href="/en-US/docs/Web/API/SVGTransformList" title="The SVGTransformList defines a list of SVGTransform objects."><code>SVGTransformList</code></a> representing the current animated value of the given attribute. If the given attribute is not currently being animated, then the <a href="/en-US/docs/Web/API/SVGTransformList" title="The SVGTransformList defines a list of SVGTransform objects."><code>SVGTransformList</code></a> will have the same contents as <code>baseVal</code>. The object referenced by <code>animVal</code> will always be distinct from the one referenced by <code>baseVal</code>, even when the attribute is not animated.</div>
  </li>
  <li>
    <a href="">baseVal</a>
    <div>The base value of the given attribute before applying any animations.</div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
