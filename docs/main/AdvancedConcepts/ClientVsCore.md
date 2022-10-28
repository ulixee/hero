# Client vs. Core

Hero's architecture is split into two processes: a Client and a Core. The Client is what your script interacts with; Core is what does most of the heavy lifting. WebSockets is the default mechanism for communicating between these two processes. Most users have no need to know anything about Core since Hero simpliy works out of the box.

However, this division of process allows for some interesting advanced configurations. For example, you can run a single lightweight Client on one lightweight machine with multiple Cores running on separate heavier-duty machines.

## Setting Up a Server Process for Core

The `@ulixee/hero-core` package contains all the logic for running Core, but it has no network connectivity. The easiest solution is to use the `@ulixee/miner` package. See details of the Ulixee Miner [here](/docs/miner).

Various other strategies are listed [here](/docs/miner/advanced-concepts/deployment).
