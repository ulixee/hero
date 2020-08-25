# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.11](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.10...v1.0.0-alpha.11) (2020-08-25)


### Bug Fixes

* copy engine to deployed emulators ([98ea24c](https://github.com/ulixee/secret-agent/commit/98ea24ca25d0cebbc1b6f6d572134e63318ce941))





# [1.0.0-alpha.10](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2020-08-25)


### Bug Fixes

* dependency/path issues ([17a6813](https://github.com/ulixee/secret-agent/commit/17a681335a3cd28cf7a668f5efd58229fa1cc59e))





# [1.0.0-alpha.9](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2020-08-25)


### Bug Fixes

* humanoid keys => ids ([a30652e](https://github.com/ulixee/secret-agent/commit/a30652e5e664955e2f337799a986447e18f25f3a))
* **emulators:** wait for doc element ([c67fbf8](https://github.com/ulixee/secret-agent/commit/c67fbf8cc089881a2bf4a5def83dcac67630e4f2))
* **mitm-socket:** chrome 83 tls signature ([a699212](https://github.com/ulixee/secret-agent/commit/a6992121ba7a7ee8e4f42ca1f78c4f1335c281b7)), closes [#48](https://github.com/ulixee/secret-agent/issues/48) [#23](https://github.com/ulixee/secret-agent/issues/23)
* **replay:** fix realtime not loading correctly ([29ff447](https://github.com/ulixee/secret-agent/commit/29ff4471073a15505d27d5453cb1c13daf824f83))
* **replay:** fix rendering doctype + svg ([ac36c79](https://github.com/ulixee/secret-agent/commit/ac36c791c9d3611874900c65e8180b7daa1ed232))
* vue structure for replay ([0e38bfa](https://github.com/ulixee/secret-agent/commit/0e38bfa5f16c63a7900136e2300214bda395a5cf))


### Features

* **ci:** windows tests ([fd5e9db](https://github.com/ulixee/secret-agent/commit/fd5e9dbd2bdd1ac4fcba94f46e8cba4eb2ce7319))
* **core:** enhance logs ([a5b6d58](https://github.com/ulixee/secret-agent/commit/a5b6d58a7fbf74415d7094b374f040ab1ca2890a))
* **emulators:** add windows runtime polyfills ([51ebb11](https://github.com/ulixee/secret-agent/commit/51ebb1107ff42f19a453a268c243b19c2d0f2644))
* **emulators:** enable multi-engine support ([1e008c9](https://github.com/ulixee/secret-agent/commit/1e008c9fe26c977ebf85c665d0891023342a58b5))
* **mitm:** support push streams ([1b2af06](https://github.com/ulixee/secret-agent/commit/1b2af0655445929ac1f4fb8dcac011b9623a75d4))
* **replay:** stream data and simplify tick tracker ([91c350c](https://github.com/ulixee/secret-agent/commit/91c350cdbf9f99c19754fbb5598afe62a13fb497))
* restructure frontend to match vue project ([f3348a0](https://github.com/ulixee/secret-agent/commit/f3348a01650e2747a26fa0b2ab9bd4c082300f37))





# [1.0.0-alpha.8](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.8) (2020-08-05)


### Bug Fixes

* **emulator-plugins:** include origin for cors ([b1449c1](https://github.com/ulixee/secret-agent/commit/b1449c1233dc692ccfc68d3b81070e5ff7b9fcba))
* **replay:** handle frames and page source changes ([fc703d5](https://github.com/ulixee/secret-agent/commit/fc703d5181eb961307b44553aa02a62f4faf98c0))
* circleci configs ([7d8e213](https://github.com/ulixee/secret-agent/commit/7d8e213032baa58a14d9f9eb6f161b4b2996b5c0))
* pool socket connections per origin ([0075f18](https://github.com/ulixee/secret-agent/commit/0075f18a64a2761f0979c072e42958002664b2df))
* **ci:** circle ci fixes ([24596b5](https://github.com/ulixee/secret-agent/commit/24596b5b8903d4857e60aac964a1c7f5e43731c6))
* **core:** core should autoclose if not started ([8d46a77](https://github.com/ulixee/secret-agent/commit/8d46a775573733aa53cef1723fb71d60485fae9f)), closes [#41](https://github.com/ulixee/secret-agent/issues/41)
* **mitm:** windows sockets ([dc3cf7d](https://github.com/ulixee/secret-agent/commit/dc3cf7df9dc6ad829ed21323cb8a7ab6a2cbf9b7))
* **replay:** fix launch path to replay ([8d7059b](https://github.com/ulixee/secret-agent/commit/8d7059b476ea65b440b18f6e8fe59ecc6ba95bd3))
* **socket:** http2 requests not reusing sockets ([3cbf853](https://github.com/ulixee/secret-agent/commit/3cbf8531589536c763525086cfea407c3435ca9b))
* use os tmp directory ([e1f5a2b](https://github.com/ulixee/secret-agent/commit/e1f5a2b7e63470b626ed906170b5c0337f5e0c43))
* windows tests ([c2943e8](https://github.com/ulixee/secret-agent/commit/c2943e844d53c11f829baed60c449604e81544c8))


### Features

* **mitm:** record blocked and cached http ([bd47738](https://github.com/ulixee/secret-agent/commit/bd47738e010c962e529a048d4ee33211d67a6d8f))
* **replay:** fix picker ([50d7885](https://github.com/ulixee/secret-agent/commit/50d7885f836067d51dc1ef50b41376cd9e3b9508))
* **replay:** replay individual ticks on interval ([e1c29f4](https://github.com/ulixee/secret-agent/commit/e1c29f443169ca4d141dcd0943ae8b493b31d6c8))
* **replay:** split app/replay in electron backend ([3b66eec](https://github.com/ulixee/secret-agent/commit/3b66eec372900e764872857b67f80817f4ba2b9e))
* **session-state:** capture requests before send ([9607793](https://github.com/ulixee/secret-agent/commit/960779370fa439d1c173e855bb8bdf907de9abc6))
* circle-ci fixes ([aac9a30](https://github.com/ulixee/secret-agent/commit/aac9a30a3d9b6352e2e845cc2cd4ac6eca6bdd7a))





# [1.0.0-alpha.7](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2020-07-27)


### Bug Fixes

* **ci:** circle ci fixes ([24596b5](https://github.com/ulixee/secret-agent/commit/24596b5b8903d4857e60aac964a1c7f5e43731c6))
* windows tests ([c2943e8](https://github.com/ulixee/secret-agent/commit/c2943e844d53c11f829baed60c449604e81544c8))
* **mitm:** windows sockets ([dc3cf7d](https://github.com/ulixee/secret-agent/commit/dc3cf7df9dc6ad829ed21323cb8a7ab6a2cbf9b7))
* **replay:** fix launch path to replay ([8d7059b](https://github.com/ulixee/secret-agent/commit/8d7059b476ea65b440b18f6e8fe59ecc6ba95bd3))
* use os tmp directory ([e1f5a2b](https://github.com/ulixee/secret-agent/commit/e1f5a2b7e63470b626ed906170b5c0337f5e0c43))


### Features

* circle-ci fixes ([aac9a30](https://github.com/ulixee/secret-agent/commit/aac9a30a3d9b6352e2e845cc2cd4ac6eca6bdd7a))





# [1.0.0-alpha.6](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2020-07-22)


### Bug Fixes

* lerna packages ([92798e8](https://github.com/ulixee/secret-agent/commit/92798e8c9a017754ec86edf3dfe09de90828cb00))
* packaging issues with mitm and replay ([520a912](https://github.com/ulixee/secret-agent/commit/520a912d50b935270b75f2d6ef1faf5fed796e85))





# [1.0.0-alpha.5](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2020-07-21)


### Bug Fixes

* **replay:** fix replay api usage ([c54fe64](https://github.com/ulixee/secret-agent/commit/c54fe64b710519088cda4638c7ad2b16a5313e13))





# [1.0.0-alpha.4](https://github.com/ulixee/secret-agent/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2020-07-20)


### Bug Fixes

* **replay:** cover last tick on playbar ([baf12e7](https://github.com/ulixee/secret-agent/commit/baf12e795fade634e60c64a342ea339ac6e8aa5c))
* **replay:** record close date when errors occcur ([2ce94dd](https://github.com/ulixee/secret-agent/commit/2ce94dd694bba172028e8b7b00f0b3e0df0e0163)), closes [#31](https://github.com/ulixee/secret-agent/issues/31)
* change shared package names ([d6181a7](https://github.com/ulixee/secret-agent/commit/d6181a75a0387797177eb9aa2f71553bb7d31432))
* publish README.md with next build ([4c8b942](https://github.com/ulixee/secret-agent/commit/4c8b9428616c743a1282ad2f67a42ed74a3ebd60))


### Features

* **replay:** add mouse/focus/scroll events ([efec55c](https://github.com/ulixee/secret-agent/commit/efec55cf093bd4207164abd304a64f73620c45a9))
* **replay:** add session logs, detect errors ([f1865c0](https://github.com/ulixee/secret-agent/commit/f1865c0aef38f6722bbcdee0244288f0f6040c5a)), closes [#31](https://github.com/ulixee/secret-agent/issues/31)
* **replay:** autoplay replay ([bd13ef5](https://github.com/ulixee/secret-agent/commit/bd13ef56728d4582a3e4827e21f1688e6269fbb2))
* **replay:** show commands in playbar ([58b9f7a](https://github.com/ulixee/secret-agent/commit/58b9f7ac153480382cbd2f4c2f00aec64e7e852b))
* **replay:** start api from process ([403716b](https://github.com/ulixee/secret-agent/commit/403716b3ba853c67ef15868fd6fb9fe1f60dbc1f))
* flatten shared workspaces ([d53da16](https://github.com/ulixee/secret-agent/commit/d53da165d649163dcb724225a2ea43ce88d7eacc))





# 1.0.0-alpha.3 (2020-07-07)


### Bug Fixes

* **mitm:** small tweak for mitm tests hanging ([c969870](https://github.com/ulixee/secret-agent/commit/c969870dc2f86fc107f5cc9b342b36b831ac906a))
* **session-state:** Improve page recorder perf ([14f78b9](https://github.com/ulixee/secret-agent/commit/14f78b9ede550ded32594dc0a773cc880bf02783)), closes [#8](https://github.com/ulixee/secret-agent/issues/8)
* .gitignore was ignoring files that were needed for website ([4b9a2e4](https://github.com/ulixee/secret-agent/commit/4b9a2e4d12c88a44a78c39c0872556990cb1bb74))
* mitm timing out large bodies ([d38e78f](https://github.com/ulixee/secret-agent/commit/d38e78ff0536996eefa32eb6aace848a06350f53)), closes [#8](https://github.com/ulixee/secret-agent/issues/8)


### Features

* **dist:** improve packaging for double agent ([df195b6](https://github.com/ulixee/secret-agent/commit/df195b630b90aea343e4bd3005d41b34c4d5431a))
* **emulators:** Emulator plugins - set agent ([e53cedb](https://github.com/ulixee/secret-agent/commit/e53cedbfca077239d36116f22d5be2d1ab9ec7a3)), closes [#8](https://github.com/ulixee/secret-agent/issues/8)
* **emulators:** improve page logging ([cb73806](https://github.com/ulixee/secret-agent/commit/cb73806408ef7c235e4ff70539c8cc49e5cd5d90))





# 1.0.0-alpha.2 (2020-06-27)


### Bug Fixes

* Emulator plugin referencing relative paths ([f26feab](https://github.com/ulixee/secret-agent/commit/f26feab5899fa11e73ad55d6239912b798aa0e79))
* missing dependencies ([67504f0](https://github.com/ulixee/secret-agent/commit/67504f0f070f35ded261ec3c9734d60422b75a96))





# 1.0.0-alpha.1 (2020-06-27)


### Bug Fixes

* Emulator plugin referencing relative paths ([f26feab](https://github.com/ulixee/secret-agent/commit/f26feab5899fa11e73ad55d6239912b798aa0e79))





# 1.0.0-alpha.0 (2020-06-27)

**Note:** Version bump only for package secret-agent
