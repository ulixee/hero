# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-alpha.22](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.21...v2.0.0-alpha.22) (2023-06-12)


### Bug Fixes

* **emulator:** require debug ext for webgl params ([ed5e43f](https://github.com/ulixee/unblocked/commit/ed5e43fd0ec7b200090d34ecf1856ade95b17e59))
* **plugins:** failing test ([b0574e4](https://github.com/ulixee/unblocked/commit/b0574e4bf6c2f17db8fe72475c06da065d493234))
* rollback nanoid upgrade. broke requirejs ([50c2000](https://github.com/ulixee/unblocked/commit/50c2000cd7785ca54e1845412e211716d9dbaf4e))


### Features

* **plugins:** include default color depth ([166d3b4](https://github.com/ulixee/unblocked/commit/166d3b4e1db94c2665324c524dfc6390cd0e64ba))
* test for console.debug ([3f140b8](https://github.com/ulixee/unblocked/commit/3f140b82c54a13fd2f3faaf687932b7b28e53066))





# [2.0.0-alpha.21](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.20...v2.0.0-alpha.21) (2023-04-24)


### Bug Fixes

* **agent:** test stack trace detect in browser ([#62](https://github.com/ulixee/unblocked/issues/62)) ([b716e59](https://github.com/ulixee/unblocked/commit/b716e592808cd640c034e89e95964155cb11fdf5))





# [2.0.0-alpha.20](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.18...v2.0.0-alpha.20) (2023-04-19)


### Bug Fixes

* **agent:** get dom node id from parent frame ([5158d7d](https://github.com/ulixee/unblocked/commit/5158d7d323f3ae5536b31378706e431e6646d598))
* **agent:** no autoattach when browser connects ([1ab573d](https://github.com/ulixee/unblocked/commit/1ab573df817226afdbd9f0b31c732ef171068604))
* **agent:** reconnect crashed shared workers ([4d28798](https://github.com/ulixee/unblocked/commit/4d287983337e2f73097776a4b15c89ac236a35f2))
* **agent:** release memory leaks ([934dcdb](https://github.com/ulixee/unblocked/commit/934dcdba48bb0524f47e7ff60aca2fb4afdbd77a))
* **default-browser-emulator:** default disable tcp ([5d74fd4](https://github.com/ulixee/unblocked/commit/5d74fd4ddb4cb5300a0a8e0c72808a53ceedd8fc))
* **default-browser-emulator:** plugins detectable ([c461fa2](https://github.com/ulixee/unblocked/commit/c461fa2c069117444502b7e4f8e869e202dfaa05))
* **plugins:** avoid incognito detection ([8ced043](https://github.com/ulixee/unblocked/commit/8ced043473f44dd82961a7f96db9def797624e71))
* **plugins:** check for webkitTemporaryStorage ([38bfa6f](https://github.com/ulixee/unblocked/commit/38bfa6f437454286750a784b4ee304f685922b8f))
* **plugins:** ensure sec-cha-ua is correct ([add8df4](https://github.com/ulixee/unblocked/commit/add8df48b875dc890cc045205eabbf87ee364729))
* **plugins:** fix sec ch viewport settings ([749750c](https://github.com/ulixee/unblocked/commit/749750c156daa7decdd5a52ca744205b9f7b4b47))
* **plugins:** srcdoc iframe returning wrong doc ([9910ec6](https://github.com/ulixee/unblocked/commit/9910ec680c163d3011ec2bc8337873824f016e74))
* should use inner ([1026547](https://github.com/ulixee/unblocked/commit/102654757c18fcfc785d1cd945f6842b67e1053f))


### Features

* **agent:** enable out of process iframes ([#50](https://github.com/ulixee/unblocked/issues/50)) ([77b96c8](https://github.com/ulixee/unblocked/commit/77b96c8ae37e7de36a9b38c6d76a1498d34dee81))
* **agent:** try to use chrome headless=new mode ([18999c7](https://github.com/ulixee/unblocked/commit/18999c71679ae04c46e1f5218d4be21ccc5af561))
* **browser-emulator:** add full user version list ([b783db2](https://github.com/ulixee/unblocked/commit/b783db276f2637c9d0a65c44061373cb6b4d11cc))
* **plugins:** don’t load unnecessary plugins ([fcfdacd](https://github.com/ulixee/unblocked/commit/fcfdacd1dda71f54b79466d445e6842714d40c3a))
* set unavailable screen ([b7402b0](https://github.com/ulixee/unblocked/commit/b7402b0cbbd99ac11d16fd7ab0cdf0ebded764ee))





# [2.0.0-alpha.19](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.18...v2.0.0-alpha.19) (2023-02-25)


### Bug Fixes

* **agent:** no autoattach when browser connects ([1ab573d](https://github.com/ulixee/unblocked/commit/1ab573df817226afdbd9f0b31c732ef171068604))
* **agent:** release memory leaks ([934dcdb](https://github.com/ulixee/unblocked/commit/934dcdba48bb0524f47e7ff60aca2fb4afdbd77a))
* **default-browser-emulator:** default disable tcp ([5d74fd4](https://github.com/ulixee/unblocked/commit/5d74fd4ddb4cb5300a0a8e0c72808a53ceedd8fc))
* **default-browser-emulator:** plugins detectable ([c461fa2](https://github.com/ulixee/unblocked/commit/c461fa2c069117444502b7e4f8e869e202dfaa05))
* **plugins:** avoid incognito detection ([8ced043](https://github.com/ulixee/unblocked/commit/8ced043473f44dd82961a7f96db9def797624e71))
* **plugins:** check for webkitTemporaryStorage ([38bfa6f](https://github.com/ulixee/unblocked/commit/38bfa6f437454286750a784b4ee304f685922b8f))
* **plugins:** ensure sec-cha-ua is correct ([add8df4](https://github.com/ulixee/unblocked/commit/add8df48b875dc890cc045205eabbf87ee364729))
* should use inner ([1026547](https://github.com/ulixee/unblocked/commit/102654757c18fcfc785d1cd945f6842b67e1053f))


### Features

* **agent:** try to use chrome headless=new mode ([18999c7](https://github.com/ulixee/unblocked/commit/18999c71679ae04c46e1f5218d4be21ccc5af561))
* **plugins:** don’t load unnecessary plugins ([fcfdacd](https://github.com/ulixee/unblocked/commit/fcfdacd1dda71f54b79466d445e6842714d40c3a))
* set unavailable screen ([b7402b0](https://github.com/ulixee/unblocked/commit/b7402b0cbbd99ac11d16fd7ab0cdf0ebded764ee))





# [2.0.0-alpha.18](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.17...v2.0.0-alpha.18) (2023-01-17)


### Bug Fixes

* deviceMemory heap size not overriding getters ([cf08449](https://github.com/ulixee/unblocked/commit/cf0844940469ce474cfe6a3bf321dc1f5347d9dc))
* ensure ipLookupServices can handle http2 ([ea9bb11](https://github.com/ulixee/unblocked/commit/ea9bb11fdcfa7ebee8ea3aa35577ef8721b994fb)), closes [#29](https://github.com/ulixee/unblocked/issues/29) [#28](https://github.com/ulixee/unblocked/issues/28)
* navigator.plugins uint32 overflow ([221cef9](https://github.com/ulixee/unblocked/commit/221cef97e0445966196e7491fe62eda8e4ab2c64))
* pool test broken ([63b20ea](https://github.com/ulixee/unblocked/commit/63b20eae9b4449e9de4323d25e39631aece0b73f))


### Features

* cache machine ip ([0325fd3](https://github.com/ulixee/unblocked/commit/0325fd300d26f218e8b357610eec330e322db192))
* **plugins:** disable ip proxy by default ([a9a79bc](https://github.com/ulixee/unblocked/commit/a9a79bcc56bba9c107a8f380298e38a28a90af1e)), closes [#29](https://github.com/ulixee/unblocked/issues/29)





# [2.0.0-alpha.17](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.15...v2.0.0-alpha.17) (2022-12-15)


### Bug Fixes

* correctly set user agent platform and memory ([1b11514](https://github.com/ulixee/unblocked/commit/1b115148c0cbb6bf972c912ad5a5d1ca0236e439))
* handle installed chrome not being latest ([cf94c1d](https://github.com/ulixee/unblocked/commit/cf94c1d217d08b7b05e46d266a100edc9da35891))
* proxy leak in js ([54bf072](https://github.com/ulixee/unblocked/commit/54bf0727a74608441444d75c7daf5dc85ce32c01))


### Features

* invert disableDevtools and default to off ([b66d8cc](https://github.com/ulixee/unblocked/commit/b66d8cc13d716acc99014ffcb818650ebc2624a2))





# [2.0.0-alpha.15](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.14...v2.0.0-alpha.15) (2022-12-05)


### Bug Fixes

* **plugins:** check that performance.memory exists ([a05a2b1](https://github.com/ulixee/unblocked/commit/a05a2b1f74aa86ec000427427eeb799f77a4cd74))


### Features

* add dns failovers to help tests ([241c4a0](https://github.com/ulixee/unblocked/commit/241c4a0b0c3a34ec2ea0d10cc9972f779ba1082e))





# [2.0.0-alpha.14](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.13...v2.0.0-alpha.14) (2022-11-17)


### Bug Fixes

* publish connect errors ([a917c8d](https://github.com/ulixee/unblocked/commit/a917c8dca16ac9220f8d6e4aab41f5fa71d1bc9b))





# [2.0.0-alpha.13](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.12...v2.0.0-alpha.13) (2022-11-02)


### Bug Fixes

* convert ubk vars to ulx ([ca3ccf6](https://github.com/ulixee/unblocked/commit/ca3ccf6f6d6b8783507f4155d8b5b9a7bbee0313))
* tweak readme ([1487b53](https://github.com/ulixee/unblocked/commit/1487b534bb679efad2c7df5254f8bfbfec28fbfd))





# [2.0.0-alpha.12](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.11...v2.0.0-alpha.12) (2022-10-31)


### Bug Fixes

* update env parsing of paths ([9dbade6](https://github.com/ulixee/unblocked/commit/9dbade6214ac1abb00eec47c7e1b16669b558a58))





# [2.0.0-alpha.11](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.10...v2.0.0-alpha.11) (2022-10-03)


### Bug Fixes

* windows builds ([f70a5ca](https://github.com/ulixee/unblocked/commit/f70a5cac40010d88a876e54664e249d8d49b6531))


### Features

* browser emulator generator ([badfa6e](https://github.com/ulixee/unblocked/commit/badfa6ed2397c2dd1dfcff78bd44cc5adca6a130))
* max heap size ([a70cf8d](https://github.com/ulixee/unblocked/commit/a70cf8dfc2fadb04bd2225505c60eb12ae7c7e20))
* move user agent data out of emulator ([85fdeac](https://github.com/ulixee/unblocked/commit/85fdeacc0aef4343cd0d0abec87eecc783cd7d85))
* **plugins:** use browser profiler data ([7504fce](https://github.com/ulixee/unblocked/commit/7504fce1e9778e3dfdf4d71c5dce0602a62bfda0))
* speech synthesis emulation ([22f1591](https://github.com/ulixee/unblocked/commit/22f1591c5efbd10789c844fc28f18e0364d0443f))







**Note:** Version bump only for package @ulixee/default-browser-emulator





# [2.0.0-alpha.9](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.8...v2.0.0-alpha.9) (2022-08-16)

**Note:** Version bump only for package @ulixee/default-browser-emulator





# [2.0.0-alpha.8](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.7...v2.0.0-alpha.8) (2022-08-16)


### Bug Fixes

* **plugins:** toString leaking proxy ([aea9a73](https://github.com/ulixee/unblocked/commit/aea9a735ed4b19b884140ab68348683a13b786c6)), closes [#5](https://github.com/ulixee/unblocked/issues/5)


### Features

* modify flags ([e80ebc6](https://github.com/ulixee/unblocked/commit/e80ebc607f75026668803e5f46531d0754aeb65d))





# [2.0.0-alpha.7](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.6...v2.0.0-alpha.7) (2022-07-26)

**Note:** Version bump only for package @ulixee/default-browser-emulator





# [2.0.0-alpha.6](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.5...v2.0.0-alpha.6) (2022-07-13)

**Note:** Version bump only for package @ulixee/default-browser-emulator





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

* wrong header platform in service workers ([2f8a33c](https://github.com/ulixee/unblocked/commit/2f8a33c1e130614429e83cd1fb3c7839a46974b2))





# [2.0.0-alpha.2](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2022-05-19)

**Note:** Version bump only for package @ulixee/default-browser-emulator
