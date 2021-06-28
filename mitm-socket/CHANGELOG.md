# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.5.1](https://github.com/ulixee/secret-agent/compare/v1.5.0...v1.5.1) (2021-06-28)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.5.0](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.4...v1.5.0) (2021-06-28)


### Bug Fixes

* **mitm:** proper errors when mitm binary missing ([382669f](https://github.com/ulixee/secret-agent/commit/382669fb2d86c86e010bf16ed3cdd0391d047f85))
* navigation test hanging ([115418a](https://github.com/ulixee/secret-agent/commit/115418aa7b9d73e9ee74051a26faac4d3bea1a9f))
* **dns:** handle dns socket disconnect ([8149e61](https://github.com/ulixee/secret-agent/commit/8149e61d8eb6ea26e0e5a6c92a9f8abc6eb6dccf))
* **mitm:** clean premature shutdown errors ([8037c64](https://github.com/ulixee/secret-agent/commit/8037c6470593994cdb05a0c3a761d982472e1601))
* **mitm:** fix install script, reuse same h2 conn ([ebb0693](https://github.com/ulixee/secret-agent/commit/ebb06933879575c2bbaf311a50ac0e3ecc2ae843))
* **mitm:** handle malformed urls ([7190390](https://github.com/ulixee/secret-agent/commit/71903904ae63b9fc2a236002c1420b0a0d95e299))
* **mitm:** http2 header order wrong ([801b3c8](https://github.com/ulixee/secret-agent/commit/801b3c84a18f6eee51464d889edf9e01134fba9a))
* **mitm:** remove blocking actions ([4a75179](https://github.com/ulixee/secret-agent/commit/4a75179bc0bd1081a489e3a83d1f1dc57e50990e))


### Features

* added support for plugins ([0fda55d](https://github.com/ulixee/secret-agent/commit/0fda55d7a57d300d765c462389e76da0e1fe0822))
* **core:** waitForFileChooser ([cf3beb9](https://github.com/ulixee/secret-agent/commit/cf3beb9b3d06dbd3548e5a23746641f5addbfade))
* **mitm:** determine alpn on proxy connect ([398735d](https://github.com/ulixee/secret-agent/commit/398735d4dd8ab219c520da775e92f42ee9889544))





## [1.4.1-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.3...v1.4.1-alpha.4) (2021-04-20)


### Bug Fixes

* **mitm:** store certs with network db ([eed99f1](https://github.com/ulixee/secret-agent/commit/eed99f1c36841fc30e55265378a5c47a68ce7185))





## [1.4.1-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.2...v1.4.1-alpha.3) (2021-04-20)


### Bug Fixes

* **core:** convert dates to numbers ([da17efe](https://github.com/ulixee/secret-agent/commit/da17efecaa8301070ed3c98d8d4d423d44d50f74))
* **http:** timeout sockets that dont connect ([da59e41](https://github.com/ulixee/secret-agent/commit/da59e419756c80ece2b6b34f8365e90c82673fff))
* **mitm:** fix ipc timeouts ([851be03](https://github.com/ulixee/secret-agent/commit/851be03be65fb0718b8af8230ab76360a7f006ef))


### Features

* **mitm:** move go files to new dir ([23780f9](https://github.com/ulixee/secret-agent/commit/23780f96668e9e0ac2db2a04f7300d33b77fc09e))
* **mitm:** use shared mitm socket ([f80334b](https://github.com/ulixee/secret-agent/commit/f80334b59f03f59dda63040b28146c51cff1825d))





## [1.4.1-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.1...v1.4.1-alpha.2) (2021-04-02)


### Bug Fixes

* **mitm:** websockets use http1 in chrome ([0643003](https://github.com/ulixee/secret-agent/commit/0643003d5878913b9439cc013cc2e6533711d423))





## [1.4.1-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.4.1-alpha.0...v1.4.1-alpha.1) (2021-03-31)


### Bug Fixes

* **client:** fix logging dependency error ([22900c4](https://github.com/ulixee/secret-agent/commit/22900c49da47e8ce0d910c255d9b535527ce040d))
* **mitm:** directly handle reused socket closing ([8651445](https://github.com/ulixee/secret-agent/commit/86514453fe8e12314f61a28c7fcf1ffd673585e7))
* **mitm:** fix reusing sockets ([5d56597](https://github.com/ulixee/secret-agent/commit/5d565975554fa8d8c3603031977efe99494a19f9))





## [1.4.1-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.4.0-alpha.1...v1.4.1-alpha.0) (2021-03-23)


### Bug Fixes

* **mitm:** empty headers bug, clean errors ([3170688](https://github.com/ulixee/secret-agent/commit/3170688287dce2cc3d431a26da027e11e33049cd))
* **mitm:** fix url error ([d53ae18](https://github.com/ulixee/secret-agent/commit/d53ae18a905fce3fea45a1e19edd9498ed4c54bd))


### Features

* **client:** expose frames ([44a6b12](https://github.com/ulixee/secret-agent/commit/44a6b129fef6f541cffc24e8913fd76defcf3aef))





# [1.4.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.4.0-alpha.0...v1.4.0-alpha.1) (2021-03-11)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.4.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.3.1-alpha.1...v1.4.0-alpha.0) (2021-03-11)


### Features

* **replay:** update for mac silicon + deps ([30ffec7](https://github.com/ulixee/secret-agent/commit/30ffec74fc06485b56344f17374a082d2055c1f1))





# [1.3.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.3...v1.3.0-alpha.4) (2021-02-15)


### Bug Fixes

* **core/client:** export usable mjs/cjs ([ca149ef](https://github.com/ulixee/secret-agent/commit/ca149efbfbdf03da0fda7d127348e5de6f2a4f8b))





# [1.3.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.2...v1.3.0-alpha.3) (2021-02-11)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.3.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.1...v1.3.0-alpha.2) (2021-02-09)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.3.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.3.0-alpha.0...v1.3.0-alpha.1) (2021-02-06)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.3.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.5...v1.3.0-alpha.0) (2021-02-02)


### Features

* **client:** built-in remote + handlers ([bfaa739](https://github.com/ulixee/secret-agent/commit/bfaa739517a458db9dd1bd6374770840eb95b847))
* **core:** merge session-state and core ([dcc6002](https://github.com/ulixee/secret-agent/commit/dcc6002c2003d981267e51c8dacf5201fe3b9fda))
* **replay:** single install of replay ([5425bee](https://github.com/ulixee/secret-agent/commit/5425bee76488ac5bff4f46d8b99eb874dd7f5a35))





# [1.2.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.4...v1.2.0-alpha.5) (2020-12-29)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.2.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.3...v1.2.0-alpha.4) (2020-12-22)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.2.0-alpha.3](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.2...v1.2.0-alpha.3) (2020-12-16)


### Bug Fixes

* **mitm:** bubble proxy errors properly to client ([b6a72f5](https://github.com/ulixee/secret-agent/commit/b6a72f59ef8e7739654ab82b170aa0e15d38ebd0)), closes [#98](https://github.com/ulixee/secret-agent/issues/98)
* **replay:** multiple sessions showing incorrectly ([20ba30c](https://github.com/ulixee/secret-agent/commit/20ba30caebcef42de65dee18e6b82d92c7193d9c))





# [1.2.0-alpha.2](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.1...v1.2.0-alpha.2) (2020-12-01)


### Bug Fixes

* **core:** fix errors on goto bubbling up ([30d4208](https://github.com/ulixee/secret-agent/commit/30d4208c079e171fd6e0640810a4812e0a9a3d59))
* **mitm:** remove auth as separate proxy param ([ec14b30](https://github.com/ulixee/secret-agent/commit/ec14b302ed6389769b61e77337ba9fe873a647ed))
* **mitm-socket:** fix cpu spiking sockets ([b71e141](https://github.com/ulixee/secret-agent/commit/b71e14158c1bb948e9ce33abf01b4522930caafe))


### Features

* **proxy:** configure proxy via client + socks5 ([880c938](https://github.com/ulixee/secret-agent/commit/880c93803bebc78b835a8f2fb5133d633a315337))





# [1.2.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.2.0-alpha.0...v1.2.0-alpha.1) (2020-11-20)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.2.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.1...v1.2.0-alpha.0) (2020-11-11)


### Features

* **awaited-dom:** documentation for props ([029a1f5](https://github.com/ulixee/secret-agent/commit/029a1f5b10cc13119d4bb808d35f80cce4aeb3dd))





# [1.1.0-alpha.1](https://github.com/ulixee/secret-agent/compare/v1.1.0-alpha.0...v1.1.0-alpha.1) (2020-11-05)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.1.0-alpha.0](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.21...v1.1.0-alpha.0) (2020-11-03)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.0.0-alpha.21](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.20...v1.0.0-alpha.21) (2020-11-02)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.0.0-alpha.20](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2020-10-23)


### Features

* **mitm:** store ca/keys in network.db ([fd69f97](https://github.com/ulixee/secret-agent/commit/fd69f97cee898720d5e5a5b30e0697b728c6e8d4))
* **session-state:** record devtools logs ([784da7f](https://github.com/ulixee/secret-agent/commit/784da7f7728671485bce55b877fa350981c88ea2))





# [1.0.0-alpha.19](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2020-10-13)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.0.0-alpha.18](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2020-10-13)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.0.0-alpha.17](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2020-10-13)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.0.0-alpha.16](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2020-10-13)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.0.0-alpha.14](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2020-10-06)

**Note:** Version bump only for package @secret-agent/mitm-socket







**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.0.0-alpha.12](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2020-09-29)


### Bug Fixes

* **mitm:** simplify errors, handle not caught ([27820ac](https://github.com/ulixee/secret-agent/commit/27820ac784771b4c58e3f07bd96f15209f82f28c))





# [1.0.0-alpha.10](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2020-08-25)

**Note:** Version bump only for package @secret-agent/mitm-socket





# [1.0.0-alpha.9](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2020-08-25)


### Bug Fixes

* **mitm-socket:** chrome 83 tls signature ([a699212](https://github.com/ulixee/secret-agent/commit/a6992121ba7a7ee8e4f42ca1f78c4f1335c281b7)), closes [#48](https://github.com/ulixee/secret-agent/issues/48) [#23](https://github.com/ulixee/secret-agent/issues/23)
* **replay:** fix rendering doctype + svg ([ac36c79](https://github.com/ulixee/secret-agent/commit/ac36c791c9d3611874900c65e8180b7daa1ed232))


### Features

* **ci:** windows tests ([fd5e9db](https://github.com/ulixee/secret-agent/commit/fd5e9dbd2bdd1ac4fcba94f46e8cba4eb2ce7319))
* **emulators:** enable multi-engine support ([1e008c9](https://github.com/ulixee/secret-agent/commit/1e008c9fe26c977ebf85c665d0891023342a58b5))
* **mitm:** support push streams ([1b2af06](https://github.com/ulixee/secret-agent/commit/1b2af0655445929ac1f4fb8dcac011b9623a75d4))





# [1.0.0-alpha.8](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.8) (2020-08-05)


### Bug Fixes

* pool socket connections per origin ([0075f18](https://github.com/ulixee/secret-agent/commit/0075f18a64a2761f0979c072e42958002664b2df))


### Features

* **mitm:** record blocked and cached http ([bd47738](https://github.com/ulixee/secret-agent/commit/bd47738e010c962e529a048d4ee33211d67a6d8f))
* **replay:** replay individual ticks on interval ([e1c29f4](https://github.com/ulixee/secret-agent/commit/e1c29f443169ca4d141dcd0943ae8b493b31d6c8))
* **replay:** split app/replay in electron backend ([3b66eec](https://github.com/ulixee/secret-agent/commit/3b66eec372900e764872857b67f80817f4ba2b9e))
