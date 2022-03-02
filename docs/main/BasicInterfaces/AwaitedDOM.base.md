# AwaitedDOM

> The AwaitedDOM is a NodeJs implementation of W3C's DOM specification that makes it easy to call properties and methods located in a remote browser engine as if they were local to your scraper script context.

## What Properties and Methods Can I Use?

Many readonly properties and methods have been implemented. We haven't added DOM manipulation APIs because we believe they are easy to detect by the website. We recommend performing actions as a human as much as possible (click, type, move the mouse, etc).

On each documented class, you can find a list of the unimplemented methods and properties at the bottom.

## Introducing Supers

Supers give you access to all properties and methods of dependent classes.

[INTERFACES:Super]

Some helpers are added to the Super classes to make using Hero more intuitive. Find a list [here](/docs/basic-interfaces/dom-extenders)

## Document Interfaces

[INTERFACES:Document]

## Node Interfaces

[INTERFACES:Node]

## HTML Elements

[INTERFACES:HTMLElement]

## SVG Elements

[INTERFACES:SVGElement]

## Array-like Interfaces

[INTERFACES:ArrayLike]

## XPath Interfaces

[INTERFACES:XPath]

## Miscellaneous Interfaces

[INTERFACES:Miscellaneous]
