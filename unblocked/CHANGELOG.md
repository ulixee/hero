# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-alpha.29](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.28...v2.0.0-alpha.29) (2024-07-16)


### Bug Fixes

* **agent:** clear frames when url context changes ([#98](https://github.com/ulixee/unblocked/issues/98)) ([0eb95dc](https://github.com/ulixee/unblocked/commit/0eb95dcdcadb35c6a726ff2a1fd1d6eba1edb19e))
* **agent:** create navigation for empty frame ([a043a7b](https://github.com/ulixee/unblocked/commit/a043a7b3cc143c883c3dfd168a78537d35a29222))
* **agent:** don’t call page callbacks w/o frame ([9036ce8](https://github.com/ulixee/unblocked/commit/9036ce84c42d211489358c6c747f32802789ed85)), closes [#86](https://github.com/ulixee/unblocked/issues/86)
* **agent:** don’t show headless warning if headed ([559f3bc](https://github.com/ulixee/unblocked/commit/559f3bcc43d80f536e82b5bf6e1284260da84f70))
* **agent:** ws is buffer by default now ([3484224](https://github.com/ulixee/unblocked/commit/34842243c66131d2411169c545ed0e37f45f8214))
* **browser-emulator:** properly clean error stack ([05521ad](https://github.com/ulixee/unblocked/commit/05521ad783fcd5c5ad7ad1ea7a7d611fdff0927a))
* **browser-profiler:** need to call dom bridger ([cf3b226](https://github.com/ulixee/unblocked/commit/cf3b22610a87ddf50e778c36a3468ae461f28bf8))
* console leaking info ([#89](https://github.com/ulixee/unblocked/issues/89)) ([c10c174](https://github.com/ulixee/unblocked/commit/c10c174f20112a13f8d5a7cb636dcb4f2bf8add6))
* **default-browser-emulator:** console leaking debugger active ([#97](https://github.com/ulixee/unblocked/issues/97)) ([bdca4b0](https://github.com/ulixee/unblocked/commit/bdca4b00a61b90eb613ae37bc3c8442eadbbefcf))
* **default-browser-emulator:** undefined destructure ([#99](https://github.com/ulixee/unblocked/issues/99)) ([02d2cf1](https://github.com/ulixee/unblocked/commit/02d2cf11ae0ccfa25186713f807b68b4131b0c55))
* **dom-bridger:** update path patterns first ([f8e0d63](https://github.com/ulixee/unblocked/commit/f8e0d63de88f3de8e0ab647539bc823b8bd78f90))
* don't crash on prototype overflow ([#90](https://github.com/ulixee/unblocked/issues/90)) ([cfdb498](https://github.com/ulixee/unblocked/commit/cfdb498ee25e3cd4001efbb25954892dd7809284))
* even more console leaks ([#92](https://github.com/ulixee/unblocked/issues/92)) ([b9eea30](https://github.com/ulixee/unblocked/commit/b9eea30cf93b237c2439364c65da321fa507b39b))
* **plugins:** correct error stack for setPrototype ([776aaa8](https://github.com/ulixee/unblocked/commit/776aaa8daa5bda5613e107a37a25f373204df0ca))
* **plugins:** don’t scope emulator vars in window ([4775864](https://github.com/ulixee/unblocked/commit/477586429d1fb8147110e142783075d980f00026))
* **plugins:** proxy issues with stack traces ([#91](https://github.com/ulixee/unblocked/issues/91)) ([14354f0](https://github.com/ulixee/unblocked/commit/14354f0d43fe3f2382ef046c69efaceac65c83a1))
* **plugins:** stack for setPrototype ([f735eef](https://github.com/ulixee/unblocked/commit/f735eefcc7a3454ded032942542c26e0ba806e96))
* stack traces in utils ([9ec622e](https://github.com/ulixee/unblocked/commit/9ec622e4eef8d276c6c8e8e16a1cc625da013239))


### Features

* **browser-emulator:** hide unhandled errors and rejections ([#102](https://github.com/ulixee/unblocked/issues/102)) ([bb6fa5e](https://github.com/ulixee/unblocked/commit/bb6fa5efb2d9e9d16f787e825c0387fffcbe7cda))
* **browser:** instructions to update data files ([3bd93c0](https://github.com/ulixee/unblocked/commit/3bd93c0f21b281ee8d5ecfc8a6f7ef37faca3a87))
* chrome remote debugger over websocket ([#88](https://github.com/ulixee/unblocked/issues/88)) ([964df92](https://github.com/ulixee/unblocked/commit/964df92e73557d95690f206fcf5fe77765fec07b))
* make headless=new the default mode ([#95](https://github.com/ulixee/unblocked/issues/95)) ([c7297dd](https://github.com/ulixee/unblocked/commit/c7297dd0f90541fae430b28dc3c728df77591844))
* **plugins:** ability to configure plugins ([5bc079b](https://github.com/ulixee/unblocked/commit/5bc079bba85f50a54457c41d5c6039041ceb1e9e))
* **plugins:** option to output all json stringify ([009b032](https://github.com/ulixee/unblocked/commit/009b0325af3e4ffd61306414eb02ad7d25f3c6c2))





# [2.0.0-alpha.28](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.27...v2.0.0-alpha.28) (2024-03-11)


### Bug Fixes

* **agent:** browser not being reused ([9ff32c6](https://github.com/ulixee/unblocked/commit/9ff32c66aad929ac8abffee5698ec947d0e7cb2c))
* **agent:** handle isOpen null during agent close ([e75c907](https://github.com/ulixee/unblocked/commit/e75c907379b9b87991b3e52d57e5d785d19d8320))
* **agent:** still reject isOpen if fails ([e4114cd](https://github.com/ulixee/unblocked/commit/e4114cd18857f55141534d1f7ade18bab115e447))





# [2.0.0-alpha.27](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.26...v2.0.0-alpha.27) (2024-03-01)


### Bug Fixes

* **agent:** close agent if fails to open ([797731c](https://github.com/ulixee/unblocked/commit/797731c7b5c14438854addc272681d0302c369af))
* **agent:** max agents per browser not working ([ac6e273](https://github.com/ulixee/unblocked/commit/ac6e273262da2d5d199026ac05f5b6347a2882f2))





# [2.0.0-alpha.26](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.25...v2.0.0-alpha.26) (2024-02-02)

### Bug Fixes

- **agent:** handle backpressure of chrome instances ([c950dfa](https://github.com/ulixee/unblocked/commit/c950dfa5889249eb03c7a93ccc17fe476a7335f7))
- **agent:** in page nav on unload ([#77](https://github.com/ulixee/unblocked/issues/77)) ([f248891](https://github.com/ulixee/unblocked/commit/f248891ac434506c6d8bf08c5b90da8ef5d94b8c))
- **agent:** set default loader if no frames loaded ([b89ca99](https://github.com/ulixee/unblocked/commit/b89ca99fc35efe5571dd3406567bd4cca97ef531))
- **browser-profiler:** ignore wrong paths ([14784be](https://github.com/ulixee/unblocked/commit/14784be0eb8718b3d355ef19b5ec72ebfed9be1c))
- **double-agent:** axios.map not loading for xhr ([15aef1e](https://github.com/ulixee/unblocked/commit/15aef1ea5a40b30d0af01d20567e5f2a32d027bb))

### Features

- **agent:** default chrome 121 ([#80](https://github.com/ulixee/unblocked/issues/80)) ([d0c8737](https://github.com/ulixee/unblocked/commit/d0c8737b80ce02a4904daa9a80731b658de22c8d))
- **agent:** max agents per browser option ([54ad615](https://github.com/ulixee/unblocked/commit/54ad615e0ff991a97226efa4e7306bad80b21e52))

# [2.0.0-alpha.25](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.24...v2.0.0-alpha.25) (2023-09-28)

### Bug Fixes

- **agent:** don’t include sourcemaps for injected ([272764c](https://github.com/ulixee/unblocked/commit/272764cd60ead0b9364ecbbdfa9b97058d22a3b0))
- **default-browser-emulator:** empty ua hints ([72d0344](https://github.com/ulixee/unblocked/commit/72d034407d84c9ee70989d855dc656f0cf6cf28a))
- don't crash on promise like object ([#73](https://github.com/ulixee/unblocked/issues/73)) ([73fff18](https://github.com/ulixee/unblocked/commit/73fff18099797f86548f847cccd3825dccd8f661))
- **real-user-agents:** data corrupted for sonoma ([182d7d9](https://github.com/ulixee/unblocked/commit/182d7d9f0350dd62f0a3637f89e249d5fa2319fc))
- **real-user-agents:** identify mac sonoma ([0429d02](https://github.com/ulixee/unblocked/commit/0429d0205187b504ae1a4e2121dc7624a430c34f))

### Features

- update to chrome 117 ([#74](https://github.com/ulixee/unblocked/issues/74)) ([2d9c416](https://github.com/ulixee/unblocked/commit/2d9c416f24db87c8ff191c33c774abc0a75a4683))

# [2.0.0-alpha.24](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.23...v2.0.0-alpha.24) (2023-08-09)

### Features

- **agent:** add request/response body intercept ([#71](https://github.com/ulixee/unblocked/issues/71)) ([d072414](https://github.com/ulixee/unblocked/commit/d072414c50d4800a6adfa2b0795b8f72c05bdf9f))
- **specification:** add viewport to deviceprofile ([ea7e50e](https://github.com/ulixee/unblocked/commit/ea7e50e6c7c40656d4a4bb85580f2be9d7500373))

# [2.0.0-alpha.23](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.22...v2.0.0-alpha.23) (2023-07-07)

### Bug Fixes

- **agent:** improve cleanup of agent ([2220925](https://github.com/ulixee/unblocked/commit/2220925b06b278ab4e8b273ee00fca2041f4e444))

# [2.0.0-alpha.22](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.21...v2.0.0-alpha.22) (2023-06-12)

### Bug Fixes

- **agent:** handle oopif execution contexts ([9640a06](https://github.com/ulixee/unblocked/commit/9640a06523a43a74799d9231425d4007a76cdfbc))
- **browser-emulator:** fix color depth export ([bc2c76d](https://github.com/ulixee/unblocked/commit/bc2c76dd37e167feb293c4693fa97ba0b75f181e))
- build issue ([096610b](https://github.com/ulixee/unblocked/commit/096610b8b285ba2b12506caa95fcc6d72d4db3d6))
- **emulator:** require debug ext for webgl params ([ed5e43f](https://github.com/ulixee/unblocked/commit/ed5e43fd0ec7b200090d34ecf1856ade95b17e59))
- **plugins:** failing test ([b0574e4](https://github.com/ulixee/unblocked/commit/b0574e4bf6c2f17db8fe72475c06da065d493234))
- rollback nanoid upgrade. broke requirejs ([50c2000](https://github.com/ulixee/unblocked/commit/50c2000cd7785ca54e1845412e211716d9dbaf4e))

### Features

- **plugins:** include default color depth ([166d3b4](https://github.com/ulixee/unblocked/commit/166d3b4e1db94c2665324c524dfc6390cd0e64ba))
- test for console.debug ([3f140b8](https://github.com/ulixee/unblocked/commit/3f140b82c54a13fd2f3faaf687932b7b28e53066))

# [2.0.0-alpha.21](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.20...v2.0.0-alpha.21) (2023-04-24)

### Bug Fixes

- **agent:** test stack trace detect in browser ([#62](https://github.com/ulixee/unblocked/issues/62)) ([b716e59](https://github.com/ulixee/unblocked/commit/b716e592808cd640c034e89e95964155cb11fdf5))
- goreleaser convention ([837758a](https://github.com/ulixee/unblocked/commit/837758acb828052b2434f19bff29290a05d47789))

# [2.0.0-alpha.20](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.18...v2.0.0-alpha.20) (2023-04-19)

### Bug Fixes

- **agent:** always get full page content size ([ea62557](https://github.com/ulixee/unblocked/commit/ea62557d21209fd5a7cfd165d3e7f9417b2fae6c))
- **agent:** broadcast devtools events ([07da77f](https://github.com/ulixee/unblocked/commit/07da77f77ee0ed8e700741cfe37f70d541efcfdd))
- **agent:** devtools preferences when custom exe ([73cf16d](https://github.com/ulixee/unblocked/commit/73cf16dbdecc9a93c54a630a9d0c07a62d8a40c0))
- **agent:** don’t crash mitm during shutdown ([17011ea](https://github.com/ulixee/unblocked/commit/17011ea64c33580275200fd32cb1d4316a22fe75)), closes [#51](https://github.com/ulixee/unblocked/issues/51)
- **agent:** don’t crash parsing response url ([bf7d2bf](https://github.com/ulixee/unblocked/commit/bf7d2bf198fa6bf172e8027ecda474bfa1ac4455))
- **agent:** don’t parse json for devtools calls ([9d9e953](https://github.com/ulixee/unblocked/commit/9d9e953a065d2aefcffeab46ddc20f120bf4a244))
- **agent:** don’t timeout shutting down context ([0a3a5f5](https://github.com/ulixee/unblocked/commit/0a3a5f555ba31b1e7d8567db2c0b606f2309dd44))
- **agent:** element within shadow dom visibility ([8cc9cb7](https://github.com/ulixee/unblocked/commit/8cc9cb7e0861ad74bb95903aac5b98ec2649acec))
- **agent:** get dom node id from parent frame ([5158d7d](https://github.com/ulixee/unblocked/commit/5158d7d323f3ae5536b31378706e431e6646d598))
- **agent:** handle no url provided to resourceload ([a45d198](https://github.com/ulixee/unblocked/commit/a45d1989b6d397739534ce484cbc42068b563b89))
- **agent:** mark browser connected ([eb4e238](https://github.com/ulixee/unblocked/commit/eb4e2388d1be8356f22ee9bfb99d29da31f13da3))
- **agent:** no autoattach when browser connects ([1ab573d](https://github.com/ulixee/unblocked/commit/1ab573df817226afdbd9f0b31c732ef171068604))
- **agent:** parse partial seconds timestamp ([e4dab90](https://github.com/ulixee/unblocked/commit/e4dab904aefeb13beec86a1c9e70200590d47fa5))
- **agent:** reconnect crashed shared workers ([4d28798](https://github.com/ulixee/unblocked/commit/4d287983337e2f73097776a4b15c89ac236a35f2))
- **agent:** release memory leaks ([934dcdb](https://github.com/ulixee/unblocked/commit/934dcdba48bb0524f47e7ff60aca2fb4afdbd77a))
- **agent:** sync goto and connect timeout option ([a538329](https://github.com/ulixee/unblocked/commit/a538329530df0ed115e022cf9b21b638aa0520d7))
- **agent:** timeout all devtools requests ([2cf48e5](https://github.com/ulixee/unblocked/commit/2cf48e556bf06b3fb418e92760ccae9f9ec13f78))
- **browser-profiler:** chrome 110 not loading in docker ([86a1b2a](https://github.com/ulixee/unblocked/commit/86a1b2ab7073fcd51c734a4173f9d2ed01e7a862))
- **browser-profiler:** headless docker not working ([bee6353](https://github.com/ulixee/unblocked/commit/bee6353918eb94084876fb899cfc88a8c28f681c))
- **default-browser-emulator:** default disable tcp ([5d74fd4](https://github.com/ulixee/unblocked/commit/5d74fd4ddb4cb5300a0a8e0c72808a53ceedd8fc))
- **default-browser-emulator:** plugins detectable ([c461fa2](https://github.com/ulixee/unblocked/commit/c461fa2c069117444502b7e4f8e869e202dfaa05))
- generate dom polyfills when linux ([a9f7d74](https://github.com/ulixee/unblocked/commit/a9f7d74a16391023730939925048021b57777e59))
- **plugins:** avoid incognito detection ([8ced043](https://github.com/ulixee/unblocked/commit/8ced043473f44dd82961a7f96db9def797624e71))
- **plugins:** check for webkitTemporaryStorage ([38bfa6f](https://github.com/ulixee/unblocked/commit/38bfa6f437454286750a784b4ee304f685922b8f))
- **plugins:** ensure sec-cha-ua is correct ([add8df4](https://github.com/ulixee/unblocked/commit/add8df48b875dc890cc045205eabbf87ee364729))
- **plugins:** fix sec ch viewport settings ([749750c](https://github.com/ulixee/unblocked/commit/749750c156daa7decdd5a52ca744205b9f7b4b47))
- **plugins:** srcdoc iframe returning wrong doc ([9910ec6](https://github.com/ulixee/unblocked/commit/9910ec680c163d3011ec2bc8337873824f016e74))
- should use inner ([1026547](https://github.com/ulixee/unblocked/commit/102654757c18fcfc785d1cd945f6842b67e1053f))

### Features

- **agent:** ability to hook directly to a target ([b331297](https://github.com/ulixee/unblocked/commit/b33129731c9c541e30c421f9e2ddaac2ad55e368))
- **agent:** allow proxy local dns resolution ([#47](https://github.com/ulixee/unblocked/issues/47)) ([a9c412b](https://github.com/ulixee/unblocked/commit/a9c412b77bfc85d7d8634ade1ca647a40b3cc939))
- **agent:** enable out of process iframes ([#50](https://github.com/ulixee/unblocked/issues/50)) ([77b96c8](https://github.com/ulixee/unblocked/commit/77b96c8ae37e7de36a9b38c6d76a1498d34dee81))
- **agent:** try to use chrome headless=new mode ([18999c7](https://github.com/ulixee/unblocked/commit/18999c71679ae04c46e1f5218d4be21ccc5af561))
- **browser-emulator:** add full user version list ([b783db2](https://github.com/ulixee/unblocked/commit/b783db276f2637c9d0a65c44061373cb6b4d11cc))
- **plugins:** add shouldBlockRequest to spec ([ce826a5](https://github.com/ulixee/unblocked/commit/ce826a53133b2009c9572376d3507a0f17562513))
- **plugins:** don’t load unnecessary plugins ([fcfdacd](https://github.com/ulixee/unblocked/commit/fcfdacd1dda71f54b79466d445e6842714d40c3a))
- set unavailable screen ([b7402b0](https://github.com/ulixee/unblocked/commit/b7402b0cbbd99ac11d16fd7ab0cdf0ebded764ee))

# [2.0.0-alpha.19](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.18...v2.0.0-alpha.19) (2023-02-25)

### Bug Fixes

- **agent:** always get full page content size ([ea62557](https://github.com/ulixee/unblocked/commit/ea62557d21209fd5a7cfd165d3e7f9417b2fae6c))
- **agent:** devtools preferences when custom exe ([73cf16d](https://github.com/ulixee/unblocked/commit/73cf16dbdecc9a93c54a630a9d0c07a62d8a40c0))
- **agent:** don’t crash parsing response url ([bf7d2bf](https://github.com/ulixee/unblocked/commit/bf7d2bf198fa6bf172e8027ecda474bfa1ac4455))
- **agent:** don’t parse json for devtools calls ([9d9e953](https://github.com/ulixee/unblocked/commit/9d9e953a065d2aefcffeab46ddc20f120bf4a244))
- **agent:** don’t timeout shutting down context ([0a3a5f5](https://github.com/ulixee/unblocked/commit/0a3a5f555ba31b1e7d8567db2c0b606f2309dd44))
- **agent:** element within shadow dom visibility ([8cc9cb7](https://github.com/ulixee/unblocked/commit/8cc9cb7e0861ad74bb95903aac5b98ec2649acec))
- **agent:** mark browser connected ([eb4e238](https://github.com/ulixee/unblocked/commit/eb4e2388d1be8356f22ee9bfb99d29da31f13da3))
- **agent:** no autoattach when browser connects ([1ab573d](https://github.com/ulixee/unblocked/commit/1ab573df817226afdbd9f0b31c732ef171068604))
- **agent:** parse partial seconds timestamp ([e4dab90](https://github.com/ulixee/unblocked/commit/e4dab904aefeb13beec86a1c9e70200590d47fa5))
- **agent:** release memory leaks ([934dcdb](https://github.com/ulixee/unblocked/commit/934dcdba48bb0524f47e7ff60aca2fb4afdbd77a))
- **agent:** sync goto and connect timeout option ([a538329](https://github.com/ulixee/unblocked/commit/a538329530df0ed115e022cf9b21b638aa0520d7))
- **agent:** timeout all devtools requests ([2cf48e5](https://github.com/ulixee/unblocked/commit/2cf48e556bf06b3fb418e92760ccae9f9ec13f78))
- **browser-profiler:** chrome 110 not loading in docker ([86a1b2a](https://github.com/ulixee/unblocked/commit/86a1b2ab7073fcd51c734a4173f9d2ed01e7a862))
- **default-browser-emulator:** default disable tcp ([5d74fd4](https://github.com/ulixee/unblocked/commit/5d74fd4ddb4cb5300a0a8e0c72808a53ceedd8fc))
- **default-browser-emulator:** plugins detectable ([c461fa2](https://github.com/ulixee/unblocked/commit/c461fa2c069117444502b7e4f8e869e202dfaa05))
- **plugins:** avoid incognito detection ([8ced043](https://github.com/ulixee/unblocked/commit/8ced043473f44dd82961a7f96db9def797624e71))
- **plugins:** check for webkitTemporaryStorage ([38bfa6f](https://github.com/ulixee/unblocked/commit/38bfa6f437454286750a784b4ee304f685922b8f))
- **plugins:** ensure sec-cha-ua is correct ([add8df4](https://github.com/ulixee/unblocked/commit/add8df48b875dc890cc045205eabbf87ee364729))
- should use inner ([1026547](https://github.com/ulixee/unblocked/commit/102654757c18fcfc785d1cd945f6842b67e1053f))

### Features

- **agent:** ability to hook directly to a target ([b331297](https://github.com/ulixee/unblocked/commit/b33129731c9c541e30c421f9e2ddaac2ad55e368))
- **agent:** allow proxy local dns resolution ([#47](https://github.com/ulixee/unblocked/issues/47)) ([a9c412b](https://github.com/ulixee/unblocked/commit/a9c412b77bfc85d7d8634ade1ca647a40b3cc939))
- **agent:** try to use chrome headless=new mode ([18999c7](https://github.com/ulixee/unblocked/commit/18999c71679ae04c46e1f5218d4be21ccc5af561))
- **plugins:** add shouldBlockRequest to spec ([ce826a5](https://github.com/ulixee/unblocked/commit/ce826a53133b2009c9572376d3507a0f17562513))
- **plugins:** don’t load unnecessary plugins ([fcfdacd](https://github.com/ulixee/unblocked/commit/fcfdacd1dda71f54b79466d445e6842714d40c3a))
- set unavailable screen ([b7402b0](https://github.com/ulixee/unblocked/commit/b7402b0cbbd99ac11d16fd7ab0cdf0ebded764ee))

# [2.0.0-alpha.18](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.17...v2.0.0-alpha.18) (2023-01-17)

### Bug Fixes

- add missing expect ([42f48fe](https://github.com/ulixee/unblocked/commit/42f48fe28e856c6da4e306568c0b8d6d29a61c02))
- **agent:** don’t crash if no nav history found ([c2159f8](https://github.com/ulixee/unblocked/commit/c2159f8617e18ec5ce15c816c6cc257c773c2563))
- **agent:** don’t log worker emulation as errors ([3ec779b](https://github.com/ulixee/unblocked/commit/3ec779b51d04bd7df8d11f2e7dfd0ee05a0b31f4)), closes [#30](https://github.com/ulixee/unblocked/issues/30)
- **agent:** handle new page can’t get readystate ([714eccf](https://github.com/ulixee/unblocked/commit/714eccf503e1de9ee0c8f019b5d50fc442c94b11))
- deviceMemory heap size not overriding getters ([cf08449](https://github.com/ulixee/unblocked/commit/cf0844940469ce474cfe6a3bf321dc1f5347d9dc))
- ensure ipLookupServices can handle http2 ([ea9bb11](https://github.com/ulixee/unblocked/commit/ea9bb11fdcfa7ebee8ea3aa35577ef8721b994fb)), closes [#29](https://github.com/ulixee/unblocked/issues/29) [#28](https://github.com/ulixee/unblocked/issues/28)
- github actions using bad cache path ([c97fb4c](https://github.com/ulixee/unblocked/commit/c97fb4c00070f7df307fa0fcd9bbddf6c5facaf2))
- improve testing for non-mitm nav ([08a7ddc](https://github.com/ulixee/unblocked/commit/08a7ddcc61e5b4dd46a927406b202ae709bb9ecc))
- navigator.plugins uint32 overflow ([221cef9](https://github.com/ulixee/unblocked/commit/221cef97e0445966196e7491fe62eda8e4ab2c64))
- pool test broken ([63b20ea](https://github.com/ulixee/unblocked/commit/63b20eae9b4449e9de4323d25e39631aece0b73f))
- support fullscreen screenshots ([23a7e74](https://github.com/ulixee/unblocked/commit/23a7e7449e5cb6b04ee4c5164da45c52cb449015))
- support screenshot outside viewport ([8d6c1d9](https://github.com/ulixee/unblocked/commit/8d6c1d9df552912d9bfb38638aae9696ab4cbb79))
- test if image is valid ([3f8eed5](https://github.com/ulixee/unblocked/commit/3f8eed5dfad1701bc1d78c4f46544b3e3c39154d))
- use os.tmpdir ([3bf0ef0](https://github.com/ulixee/unblocked/commit/3bf0ef0e835fe9ab18719f377033d596caab146c))

### Features

- cache machine ip ([0325fd3](https://github.com/ulixee/unblocked/commit/0325fd300d26f218e8b357610eec330e322db192))
- no unhandled rejections for close cancels ([d694648](https://github.com/ulixee/unblocked/commit/d694648b8b8eee23965d74d04807c4d8c1c66836))
- **plugins:** disable ip proxy by default ([a9a79bc](https://github.com/ulixee/unblocked/commit/a9a79bcc56bba9c107a8f380298e38a28a90af1e)), closes [#29](https://github.com/ulixee/unblocked/issues/29)
- simplify logic ([ff16a06](https://github.com/ulixee/unblocked/commit/ff16a06b8669b6ee4c0b7194ba2465f24c71f60b))

# [2.0.0-alpha.17](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.15...v2.0.0-alpha.17) (2022-12-15)

### Bug Fixes

- allow pool amount of browser close listeners ([a73088f](https://github.com/ulixee/unblocked/commit/a73088fa2ff09b711315ec2732899b5c0c3aee52))
- attempt to fix certificate generator error ([8a62e46](https://github.com/ulixee/unblocked/commit/8a62e4670ba32946138f356188ac78da89a8a85a))
- correctly set user agent platform and memory ([1b11514](https://github.com/ulixee/unblocked/commit/1b115148c0cbb6bf972c912ad5a5d1ca0236e439))
- handle installed chrome not being latest ([cf94c1d](https://github.com/ulixee/unblocked/commit/cf94c1d217d08b7b05e46d266a100edc9da35891))
- proxy leak in js ([54bf072](https://github.com/ulixee/unblocked/commit/54bf0727a74608441444d75c7daf5dc85ce32c01))

### Features

- enable upstream proxy when mitm diabled ([f952d6c](https://github.com/ulixee/unblocked/commit/f952d6c250837154417e3157085f6f7e2d65063c))
- improve logs for storage tracker, mitm instl ([611b08d](https://github.com/ulixee/unblocked/commit/611b08d071d2fb3f14649d844130c9416a5966be))
- improve message when no xvfb and headed ([1ccfe01](https://github.com/ulixee/unblocked/commit/1ccfe01d2967d3d7ac73558046996ff128cb2d6b))
- invert disableDevtools and default to off ([b66d8cc](https://github.com/ulixee/unblocked/commit/b66d8cc13d716acc99014ffcb818650ebc2624a2))

# [2.0.0-alpha.15](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.14...v2.0.0-alpha.15) (2022-12-05)

### Bug Fixes

- **agent:** remove process hooks on browser close ([d468b4a](https://github.com/ulixee/unblocked/commit/d468b4aba38b0f3cd800b1dc241586265ff13a38))
- don’t verify automated profile collection ([f79a367](https://github.com/ulixee/unblocked/commit/f79a367a13d59fd7d355d959a5e90df52b48f146))
- links ([7df3342](https://github.com/ulixee/unblocked/commit/7df3342339ce3f2d594d634ba9c8c1c5b617737b))
- node 18 deprecated functions ([252ac2d](https://github.com/ulixee/unblocked/commit/252ac2dfd3c46c58ed8261b69e72da074f45ca92))
- **plugins:** check that performance.memory exists ([a05a2b1](https://github.com/ulixee/unblocked/commit/a05a2b1f74aa86ec000427427eeb799f77a4cd74))
- re-enable prettier on configs ([df38416](https://github.com/ulixee/unblocked/commit/df38416e59d83134f9114701dfda778bfa23fe36))

### Features

- add dns failovers to help tests ([241c4a0](https://github.com/ulixee/unblocked/commit/241c4a0b0c3a34ec2ea0d10cc9972f779ba1082e))

# [2.0.0-alpha.14](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.13...v2.0.0-alpha.14) (2022-11-17)

### Bug Fixes

- allow double-agent install on its own ([0ab0cd3](https://github.com/ulixee/unblocked/commit/0ab0cd3968199485342f97a006ec40a3855d6331))
- don’t build double agent in dist ([21c65ec](https://github.com/ulixee/unblocked/commit/21c65ec3ef2ac1865d5383dd298885d04d40ea38))
- publish connect errors ([a917c8d](https://github.com/ulixee/unblocked/commit/a917c8dca16ac9220f8d6e4aab41f5fa71d1bc9b))

# [2.0.0-alpha.13](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.12...v2.0.0-alpha.13) (2022-11-02)

### Bug Fixes

- convert ubk vars to ulx ([ca3ccf6](https://github.com/ulixee/unblocked/commit/ca3ccf6f6d6b8783507f4155d8b5b9a7bbee0313))
- github action probes ([bc3aa6f](https://github.com/ulixee/unblocked/commit/bc3aa6fbe62a9b2335e34e9bad3d359d4884ca8f))
- tweak readme ([1487b53](https://github.com/ulixee/unblocked/commit/1487b534bb679efad2c7df5254f8bfbfec28fbfd))

### Features

- flatten specification ([4756b54](https://github.com/ulixee/unblocked/commit/4756b546f081373dc66869dab543e306caad32a6))

# [2.0.0-alpha.12](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.11...v2.0.0-alpha.12) (2022-10-31)

### Bug Fixes

- automation can’t push to repo ([f2dae11](https://github.com/ulixee/unblocked/commit/f2dae111334aa8f6dfd38e7adb64c322bd6986c9))
- automation not finding browser profile data ([f5598f2](https://github.com/ulixee/unblocked/commit/f5598f2f1dd03cea8b974232e08da7f488acb52b))
- double-agent ref out of date ([de0d79f](https://github.com/ulixee/unblocked/commit/de0d79fb37590463724f1b57bef70d6e6f3d62a9))
- update env parsing of paths ([9dbade6](https://github.com/ulixee/unblocked/commit/9dbade6214ac1abb00eec47c7e1b16669b558a58))

# [2.0.0-alpha.11](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.10...v2.0.0-alpha.11) (2022-10-03)

### Bug Fixes

- checkin command for probes ([6d01a2e](https://github.com/ulixee/unblocked/commit/6d01a2e90c682f0fa62732ae6c4510a573a365c4))
- github actions build ([4c1a435](https://github.com/ulixee/unblocked/commit/4c1a4351be2ca3d1e7c0bfb37de9e805af93b150))
- update deps, update emulator profiles dir ([b0b9d7b](https://github.com/ulixee/unblocked/commit/b0b9d7b7294cf60b462b5b6756f5447b578cbe22))
- windows builds ([f70a5ca](https://github.com/ulixee/unblocked/commit/f70a5cac40010d88a876e54664e249d8d49b6531))
- windows typescript builds ([0fb902e](https://github.com/ulixee/unblocked/commit/0fb902edfcf6427c2c7fc1b0fcc131815a367bf5))
- workspace builds from scratch ([4677464](https://github.com/ulixee/unblocked/commit/46774643e0aad907817236323a96936ebefa8b7e))

### Features

- browser emulator generator ([badfa6e](https://github.com/ulixee/unblocked/commit/badfa6ed2397c2dd1dfcff78bd44cc5adca6a130))
- create emulator data back to 94 ([f48ce13](https://github.com/ulixee/unblocked/commit/f48ce136b815e261a25008cf3ba50093ccebc177))
- max heap size ([a70cf8d](https://github.com/ulixee/unblocked/commit/a70cf8dfc2fadb04bd2225505c60eb12ae7c7e20))
- move user agent data out of emulator ([85fdeac](https://github.com/ulixee/unblocked/commit/85fdeacc0aef4343cd0d0abec87eecc783cd7d85))
- **plugins:** use browser profiler data ([7504fce](https://github.com/ulixee/unblocked/commit/7504fce1e9778e3dfdf4d71c5dce0602a62bfda0))
- speech synthesis emulation ([22f1591](https://github.com/ulixee/unblocked/commit/22f1591c5efbd10789c844fc28f18e0364d0443f))

**Note:** Version bump only for package @ulixee/unblocked

# [2.0.0-alpha.9](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.8...v2.0.0-alpha.9) (2022-08-16)

**Note:** Version bump only for package @ulixee/unblocked

# [2.0.0-alpha.8](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.7...v2.0.0-alpha.8) (2022-08-16)

### Bug Fixes

- **plugins:** toString leaking proxy ([aea9a73](https://github.com/ulixee/unblocked/commit/aea9a735ed4b19b884140ab68348683a13b786c6)), closes [#5](https://github.com/ulixee/unblocked/issues/5)

### Features

- modify flags ([e80ebc6](https://github.com/ulixee/unblocked/commit/e80ebc607f75026668803e5f46531d0754aeb65d))

# [2.0.0-alpha.7](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.6...v2.0.0-alpha.7) (2022-07-26)

**Note:** Version bump only for package @ulixee/unblocked

# [2.0.0-alpha.6](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.5...v2.0.0-alpha.6) (2022-07-13)

**Note:** Version bump only for package @ulixee/unblocked

# [2.0.0-alpha.5](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.4...v2.0.0-alpha.5) (2022-06-28)

### Bug Fixes

- **browser:** disable oopif ([1be7831](https://github.com/ulixee/unblocked/commit/1be7831d4373d433ef5e7d9b282c3306c898e0e5))
- update lint and fix the issues ([da13726](https://github.com/ulixee/unblocked/commit/da13726fa4bd6791e1c9f3a32580dea09bd89572))

### Features

- implement addDomOverrides from spec ([0f76ead](https://github.com/ulixee/unblocked/commit/0f76eadea61c16d40e14ffceeec276a4b65c0071))

# [2.0.0-alpha.4](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.3...v2.0.0-alpha.4) (2022-06-10)

### Features

- update commons for log filtering ([a1f0b32](https://github.com/ulixee/unblocked/commit/a1f0b3273144250aaa72f6950e76db016a5d074f))

# [2.0.0-alpha.3](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.1...v2.0.0-alpha.3) (2022-06-09)

### Bug Fixes

- double agent build ([5103050](https://github.com/ulixee/unblocked/commit/510305084c8e2d20d9dc8380913ab15676b2fcc8))
- lint ([7318c1f](https://github.com/ulixee/unblocked/commit/7318c1f7883679a9a26cf0725e016c52fa8a7f6f))
- typescript build issue ([2b178fe](https://github.com/ulixee/unblocked/commit/2b178fe2d30923a7a970636a42ab9e78bbaa79a3))
- wrong header platform in service workers ([2f8a33c](https://github.com/ulixee/unblocked/commit/2f8a33c1e130614429e83cd1fb3c7839a46974b2))

# [2.0.0-alpha.2](https://github.com/ulixee/unblocked/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2022-05-19)

### Bug Fixes

- lint ([7318c1f](https://github.com/ulixee/unblocked/commit/7318c1f7883679a9a26cf0725e016c52fa8a7f6f))
- typescript build issue ([2b178fe](https://github.com/ulixee/unblocked/commit/2b178fe2d30923a7a970636a42ab9e78bbaa79a3))
