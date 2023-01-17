# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-alpha.18](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.17...v2.0.0-alpha.18) (2023-01-17)


### Bug Fixes

* add missing expect ([42f48fe](https://github.com/ulixee/unblocked/commit/42f48fe28e856c6da4e306568c0b8d6d29a61c02))
* **agent:** don’t crash if no nav history found ([c2159f8](https://github.com/ulixee/unblocked/commit/c2159f8617e18ec5ce15c816c6cc257c773c2563))
* **agent:** don’t log worker emulation as errors ([3ec779b](https://github.com/ulixee/unblocked/commit/3ec779b51d04bd7df8d11f2e7dfd0ee05a0b31f4)), closes [#30](https://github.com/ulixee/unblocked/issues/30)
* **agent:** handle new page can’t get readystate ([714eccf](https://github.com/ulixee/unblocked/commit/714eccf503e1de9ee0c8f019b5d50fc442c94b11))
* deviceMemory heap size not overriding getters ([cf08449](https://github.com/ulixee/unblocked/commit/cf0844940469ce474cfe6a3bf321dc1f5347d9dc))
* ensure ipLookupServices can handle http2 ([ea9bb11](https://github.com/ulixee/unblocked/commit/ea9bb11fdcfa7ebee8ea3aa35577ef8721b994fb)), closes [#29](https://github.com/ulixee/unblocked/issues/29) [#28](https://github.com/ulixee/unblocked/issues/28)
* github actions using bad cache path ([c97fb4c](https://github.com/ulixee/unblocked/commit/c97fb4c00070f7df307fa0fcd9bbddf6c5facaf2))
* improve testing for non-mitm nav ([08a7ddc](https://github.com/ulixee/unblocked/commit/08a7ddcc61e5b4dd46a927406b202ae709bb9ecc))
* navigator.plugins uint32 overflow ([221cef9](https://github.com/ulixee/unblocked/commit/221cef97e0445966196e7491fe62eda8e4ab2c64))
* pool test broken ([63b20ea](https://github.com/ulixee/unblocked/commit/63b20eae9b4449e9de4323d25e39631aece0b73f))
* support fullscreen screenshots ([23a7e74](https://github.com/ulixee/unblocked/commit/23a7e7449e5cb6b04ee4c5164da45c52cb449015))
* support screenshot outside viewport ([8d6c1d9](https://github.com/ulixee/unblocked/commit/8d6c1d9df552912d9bfb38638aae9696ab4cbb79))
* test if image is valid ([3f8eed5](https://github.com/ulixee/unblocked/commit/3f8eed5dfad1701bc1d78c4f46544b3e3c39154d))
* use os.tmpdir ([3bf0ef0](https://github.com/ulixee/unblocked/commit/3bf0ef0e835fe9ab18719f377033d596caab146c))


### Features

* cache machine ip ([0325fd3](https://github.com/ulixee/unblocked/commit/0325fd300d26f218e8b357610eec330e322db192))
* no unhandled rejections for close cancels ([d694648](https://github.com/ulixee/unblocked/commit/d694648b8b8eee23965d74d04807c4d8c1c66836))
* **plugins:** disable ip proxy by default ([a9a79bc](https://github.com/ulixee/unblocked/commit/a9a79bcc56bba9c107a8f380298e38a28a90af1e)), closes [#29](https://github.com/ulixee/unblocked/issues/29)
* simplify logic ([ff16a06](https://github.com/ulixee/unblocked/commit/ff16a06b8669b6ee4c0b7194ba2465f24c71f60b))





# [2.0.0-alpha.17](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.15...v2.0.0-alpha.17) (2022-12-15)


### Bug Fixes

* allow pool amount of browser close listeners ([a73088f](https://github.com/ulixee/unblocked/commit/a73088fa2ff09b711315ec2732899b5c0c3aee52))
* attempt to fix certificate generator error ([8a62e46](https://github.com/ulixee/unblocked/commit/8a62e4670ba32946138f356188ac78da89a8a85a))
* correctly set user agent platform and memory ([1b11514](https://github.com/ulixee/unblocked/commit/1b115148c0cbb6bf972c912ad5a5d1ca0236e439))
* handle installed chrome not being latest ([cf94c1d](https://github.com/ulixee/unblocked/commit/cf94c1d217d08b7b05e46d266a100edc9da35891))
* proxy leak in js ([54bf072](https://github.com/ulixee/unblocked/commit/54bf0727a74608441444d75c7daf5dc85ce32c01))


### Features

* enable upstream proxy when mitm diabled ([f952d6c](https://github.com/ulixee/unblocked/commit/f952d6c250837154417e3157085f6f7e2d65063c))
* improve logs for storage tracker, mitm instl ([611b08d](https://github.com/ulixee/unblocked/commit/611b08d071d2fb3f14649d844130c9416a5966be))
* improve message when no xvfb and headed ([1ccfe01](https://github.com/ulixee/unblocked/commit/1ccfe01d2967d3d7ac73558046996ff128cb2d6b))
* invert disableDevtools and default to off ([b66d8cc](https://github.com/ulixee/unblocked/commit/b66d8cc13d716acc99014ffcb818650ebc2624a2))





# [2.0.0-alpha.15](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.14...v2.0.0-alpha.15) (2022-12-05)


### Bug Fixes

* **agent:** remove process hooks on browser close ([d468b4a](https://github.com/ulixee/unblocked/commit/d468b4aba38b0f3cd800b1dc241586265ff13a38))
* don’t verify automated profile collection ([f79a367](https://github.com/ulixee/unblocked/commit/f79a367a13d59fd7d355d959a5e90df52b48f146))
* links ([7df3342](https://github.com/ulixee/unblocked/commit/7df3342339ce3f2d594d634ba9c8c1c5b617737b))
* node 18 deprecated functions ([252ac2d](https://github.com/ulixee/unblocked/commit/252ac2dfd3c46c58ed8261b69e72da074f45ca92))
* **plugins:** check that performance.memory exists ([a05a2b1](https://github.com/ulixee/unblocked/commit/a05a2b1f74aa86ec000427427eeb799f77a4cd74))
* re-enable prettier on configs ([df38416](https://github.com/ulixee/unblocked/commit/df38416e59d83134f9114701dfda778bfa23fe36))


### Features

* add dns failovers to help tests ([241c4a0](https://github.com/ulixee/unblocked/commit/241c4a0b0c3a34ec2ea0d10cc9972f779ba1082e))





# [2.0.0-alpha.14](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.13...v2.0.0-alpha.14) (2022-11-17)


### Bug Fixes

* allow double-agent install on its own ([0ab0cd3](https://github.com/ulixee/unblocked/commit/0ab0cd3968199485342f97a006ec40a3855d6331))
* don’t build double agent in dist ([21c65ec](https://github.com/ulixee/unblocked/commit/21c65ec3ef2ac1865d5383dd298885d04d40ea38))
* publish connect errors ([a917c8d](https://github.com/ulixee/unblocked/commit/a917c8dca16ac9220f8d6e4aab41f5fa71d1bc9b))





# [2.0.0-alpha.13](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.12...v2.0.0-alpha.13) (2022-11-02)


### Bug Fixes

* convert ubk vars to ulx ([ca3ccf6](https://github.com/ulixee/unblocked/commit/ca3ccf6f6d6b8783507f4155d8b5b9a7bbee0313))
* github action probes ([bc3aa6f](https://github.com/ulixee/unblocked/commit/bc3aa6fbe62a9b2335e34e9bad3d359d4884ca8f))
* tweak readme ([1487b53](https://github.com/ulixee/unblocked/commit/1487b534bb679efad2c7df5254f8bfbfec28fbfd))


### Features

* flatten specification ([4756b54](https://github.com/ulixee/unblocked/commit/4756b546f081373dc66869dab543e306caad32a6))





# [2.0.0-alpha.12](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.11...v2.0.0-alpha.12) (2022-10-31)


### Bug Fixes

* automation can’t push to repo ([f2dae11](https://github.com/ulixee/unblocked/commit/f2dae111334aa8f6dfd38e7adb64c322bd6986c9))
* automation not finding browser profile data ([f5598f2](https://github.com/ulixee/unblocked/commit/f5598f2f1dd03cea8b974232e08da7f488acb52b))
* double-agent ref out of date ([de0d79f](https://github.com/ulixee/unblocked/commit/de0d79fb37590463724f1b57bef70d6e6f3d62a9))
* update env parsing of paths ([9dbade6](https://github.com/ulixee/unblocked/commit/9dbade6214ac1abb00eec47c7e1b16669b558a58))





# [2.0.0-alpha.11](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.10...v2.0.0-alpha.11) (2022-10-03)


### Bug Fixes

* checkin command for probes ([6d01a2e](https://github.com/ulixee/unblocked/commit/6d01a2e90c682f0fa62732ae6c4510a573a365c4))
* github actions build ([4c1a435](https://github.com/ulixee/unblocked/commit/4c1a4351be2ca3d1e7c0bfb37de9e805af93b150))
* update deps, update emulator profiles dir ([b0b9d7b](https://github.com/ulixee/unblocked/commit/b0b9d7b7294cf60b462b5b6756f5447b578cbe22))
* windows builds ([f70a5ca](https://github.com/ulixee/unblocked/commit/f70a5cac40010d88a876e54664e249d8d49b6531))
* windows typescript builds ([0fb902e](https://github.com/ulixee/unblocked/commit/0fb902edfcf6427c2c7fc1b0fcc131815a367bf5))
* workspace builds from scratch ([4677464](https://github.com/ulixee/unblocked/commit/46774643e0aad907817236323a96936ebefa8b7e))


### Features

* browser emulator generator ([badfa6e](https://github.com/ulixee/unblocked/commit/badfa6ed2397c2dd1dfcff78bd44cc5adca6a130))
* create emulator data back to 94 ([f48ce13](https://github.com/ulixee/unblocked/commit/f48ce136b815e261a25008cf3ba50093ccebc177))
* max heap size ([a70cf8d](https://github.com/ulixee/unblocked/commit/a70cf8dfc2fadb04bd2225505c60eb12ae7c7e20))
* move user agent data out of emulator ([85fdeac](https://github.com/ulixee/unblocked/commit/85fdeacc0aef4343cd0d0abec87eecc783cd7d85))
* **plugins:** use browser profiler data ([7504fce](https://github.com/ulixee/unblocked/commit/7504fce1e9778e3dfdf4d71c5dce0602a62bfda0))
* speech synthesis emulation ([22f1591](https://github.com/ulixee/unblocked/commit/22f1591c5efbd10789c844fc28f18e0364d0443f))







**Note:** Version bump only for package @ulixee/unblocked





# [2.0.0-alpha.9](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.8...v2.0.0-alpha.9) (2022-08-16)

**Note:** Version bump only for package @ulixee/unblocked





# [2.0.0-alpha.8](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.7...v2.0.0-alpha.8) (2022-08-16)


### Bug Fixes

* **plugins:** toString leaking proxy ([aea9a73](https://github.com/ulixee/unblocked/commit/aea9a735ed4b19b884140ab68348683a13b786c6)), closes [#5](https://github.com/ulixee/unblocked/issues/5)


### Features

* modify flags ([e80ebc6](https://github.com/ulixee/unblocked/commit/e80ebc607f75026668803e5f46531d0754aeb65d))





# [2.0.0-alpha.7](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.6...v2.0.0-alpha.7) (2022-07-26)

**Note:** Version bump only for package @ulixee/unblocked





# [2.0.0-alpha.6](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.5...v2.0.0-alpha.6) (2022-07-13)

**Note:** Version bump only for package @ulixee/unblocked





# [2.0.0-alpha.5](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.4...v2.0.0-alpha.5) (2022-06-28)


### Bug Fixes

* **browser:** disable oopif ([1be7831](https://github.com/ulixee/unblocked/commit/1be7831d4373d433ef5e7d9b282c3306c898e0e5))
* update lint and fix the issues ([da13726](https://github.com/ulixee/unblocked/commit/da13726fa4bd6791e1c9f3a32580dea09bd89572))


### Features

* implement addDomOverrides from spec ([0f76ead](https://github.com/ulixee/unblocked/commit/0f76eadea61c16d40e14ffceeec276a4b65c0071))





# [2.0.0-alpha.4](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.3...v2.0.0-alpha.4) (2022-06-10)


### Features

* update commons for log filtering ([a1f0b32](https://github.com/ulixee/unblocked/commit/a1f0b3273144250aaa72f6950e76db016a5d074f))





# [2.0.0-alpha.3](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.1...v2.0.0-alpha.3) (2022-06-09)


### Bug Fixes

* double agent build ([5103050](https://github.com/ulixee/unblocked/commit/510305084c8e2d20d9dc8380913ab15676b2fcc8))
* lint ([7318c1f](https://github.com/ulixee/unblocked/commit/7318c1f7883679a9a26cf0725e016c52fa8a7f6f))
* typescript build issue ([2b178fe](https://github.com/ulixee/unblocked/commit/2b178fe2d30923a7a970636a42ab9e78bbaa79a3))
* wrong header platform in service workers ([2f8a33c](https://github.com/ulixee/unblocked/commit/2f8a33c1e130614429e83cd1fb3c7839a46974b2))





# [2.0.0-alpha.2](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2022-05-19)


### Bug Fixes

* lint ([7318c1f](https://github.com/ulixee/unblocked/commit/7318c1f7883679a9a26cf0725e016c52fa8a7f6f))
* typescript build issue ([2b178fe](https://github.com/ulixee/unblocked/commit/2b178fe2d30923a7a970636a42ab9e78bbaa79a3))
