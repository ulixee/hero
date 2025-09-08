# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-alpha.33](https://github.com/ulixee/hero/compare/v2.0.0-alpha.32...v2.0.0-alpha.33) (2025-05-29)

**Note:** Version bump only for package @ulixee/hero-core

# [2.0.0-alpha.32](https://github.com/ulixee/hero/compare/v2.0.0-alpha.31...v2.0.0-alpha.32) (2025-05-28)

### Features

* **agent:** chrome 135 emulation ([fdcd31b](https://github.com/ulixee/hero/commit/fdcd31b6f4dc04e8ad716a0ba78cb571e4ed1584))

# [2.0.0-alpha.31](https://github.com/ulixee/hero/compare/v2.0.0-alpha.30...v2.0.0-alpha.31) (2024-12-07)

### Bug Fixes

* **core:** dont log devtools internal ws messages ([3c18030](https://github.com/ulixee/hero/commit/3c1803078b9ec8423b0250ef4b00fa9ab9e20d69))
* **default-browser:** os lookup wrong ([b14bf27](https://github.com/ulixee/hero/commit/b14bf27080e88c50f7c76c53b1275c1b738093c2))

### Features

* **core:** start without session persistence ([4cf7520](https://github.com/ulixee/hero/commit/4cf7520b9f4de21e3c99637c355e49e88d336ba3))

# [2.0.0-alpha.30](https://github.com/ulixee/hero/compare/v2.0.0-alpha.29...v2.0.0-alpha.30) (2024-10-11)

### Bug Fixes

* attempt to resolve node-gyp in dev ([ff3f459](https://github.com/ulixee/hero/commit/ff3f45902dc5e4793104fe7c1cbb2b5aefaf6054))
* **core:** improve max event listener warnings ([8b9422a](https://github.com/ulixee/hero/commit/8b9422ae59760576087546f827c4a3cf6459e863))
* **net:** reconnect websockets if disconnected ([922af43](https://github.com/ulixee/hero/commit/922af4345ea64fec45e377f11c8b084a3d5bb218))

### Features

* migrate away from runtime to custom websockets ([1baf701](https://github.com/ulixee/hero/commit/1baf7018e3fba1a8f5cf3fd89f077812a1fbe97c))

# [2.0.0-alpha.29](https://github.com/ulixee/platform/compare/v2.0.0-alpha.28...v2.0.0-alpha.29) (2024-07-16)

### Bug Fixes

* sync core ES exports with TS exports ([#258](https://github.com/ulixee/platform/issues/258)) ([b63f94a](https://github.com/ulixee/platform/commit/b63f94a53f00e8c1a34657b3322e77bc6cb4a808))

### Features

* add ability to manually create a newTab ([c1f0017](https://github.com/ulixee/platform/commit/c1f0017549bbee215c3ca8c416e1ab4844e297b2)), closes [#268](https://github.com/ulixee/platform/issues/268)
* **core:** enable dynamic configuration of plugins ([86bacbf](https://github.com/ulixee/platform/commit/86bacbf07fda0c1ece54d11a3a59020e88e49bd0))

# [2.0.0-alpha.28](https://github.com/ulixee/platform/compare/v2.0.0-alpha.27...v2.0.0-alpha.28) (2024-03-11)

**Note:** Version bump only for package @ulixee/hero-core

# [2.0.0-alpha.27](https://github.com/ulixee/platform/compare/v2.0.0-alpha.26...v2.0.0-alpha.27) (2024-03-01)

**Note:** Version bump only for package @ulixee/hero-core

# [2.0.0-alpha.26](https://github.com/ulixee/platform/compare/v2.0.0-alpha.25...v2.0.0-alpha.26) (2024-02-02)

### Bug Fixes

* **core:** user profile tests hanging ([c72447f](https://github.com/ulixee/platform/commit/c72447f475c334f7347fb4575e7195b15bb256ae))

# [2.0.0-alpha.25](https://github.com/ulixee/platform/compare/v2.0.0-alpha.24...v2.0.0-alpha.25) (2023-09-28)

### Bug Fixes

* **core:** don’t include source maps for injected ([0c2ee0d](https://github.com/ulixee/platform/commit/0c2ee0db548f3251c8182edd37fcfcd830e76ca3))

# [2.0.0-alpha.24](https://github.com/ulixee/platform/compare/v2.0.0-alpha.23...v2.0.0-alpha.24) (2023-08-09)

### Bug Fixes

* **client:** detach not returning elements ([34a4340](https://github.com/ulixee/platform/commit/34a4340bfc4c8ef55430481caa7e2033e3019e4e))
* **core:** fix user profile tests ([#235](https://github.com/ulixee/platform/issues/235)) ([df40699](https://github.com/ulixee/platform/commit/df406991502c0ff0df52e6a93a6c64178bfa50ca))
* **core:** timing issue with headed profiles ([14ccc8c](https://github.com/ulixee/platform/commit/14ccc8cca7ca67cd85b35009ea84247af64d3f42))

### Features

* **core:** user profile locale, tz, geo, viewport ([88e59c9](https://github.com/ulixee/platform/commit/88e59c907cd30236d8e9d4c595434c6f682133fb))

# [2.0.0-alpha.23](https://github.com/ulixee/platform/compare/v2.0.0-alpha.22...v2.0.0-alpha.23) (2023-07-07)

### Bug Fixes

* **core:** add db retention to session registry ([5af67e8](https://github.com/ulixee/platform/commit/5af67e82d5dc36e1d7b11cc11cee09520fec0fc7))
* **core:** re-add static addConnection ([428d4b0](https://github.com/ulixee/platform/commit/428d4b07d7c60a2cbb869800b6760a2db2903284))

### Features

* **core:** add productId to scriptInvocationMeta ([7cb291d](https://github.com/ulixee/platform/commit/7cb291dc612f1c7a9369df62c2eca16e684984f9))

# [2.0.0-alpha.22](https://github.com/ulixee/platform/compare/v2.0.0-alpha.21...v2.0.0-alpha.22) (2023-06-12)

### Bug Fixes

* **client:** disconnect connections on shutdown ([648f8db](https://github.com/ulixee/platform/commit/648f8db3a832833d61978502c75010f6b107addf))
* **client:** lint issues ([cc90f4f](https://github.com/ulixee/platform/commit/cc90f4fe3ef7fed8d48f5269842214ddff3ead5c))
* **core:** bypass restore-hero-dom.org in headed ([c0753e8](https://github.com/ulixee/platform/commit/c0753e8dcfe33791349a49a3c3bdf1ee458137a6))
* **core:** handle db closing timing ([0ad0175](https://github.com/ulixee/platform/commit/0ad0175bfcd20fc6402196235a6e0c63c3987feb))
* **core:** only add wal mode if not readonly db ([f74ecc4](https://github.com/ulixee/platform/commit/f74ecc4ffc20d126ed5f379b2d221b9352fdf71b))
* **core:** oopifs not injecting hero ([cc1e12b](https://github.com/ulixee/platform/commit/cc1e12b5ff975d1027f733ee655d8068d5b18385))

### Features

* **core:** allow configuring session directory ([9fda9b9](https://github.com/ulixee/platform/commit/9fda9b9d5560a3bfaf3b74c477746fbab9eded38))
* **core:** session registry ([fd10317](https://github.com/ulixee/platform/commit/fd10317a1219b1aefffd5b8162021a43c8ca6dc5))

# [2.0.0-alpha.21](https://github.com/ulixee/platform/compare/v2.0.0-alpha.20...v2.0.0-alpha.21) (2023-04-24)

**Note:** Version bump only for package @ulixee/hero-core

# [2.0.0-alpha.20](https://github.com/ulixee/platform/compare/v2.0.0-alpha.19...v2.0.0-alpha.20) (2023-04-19)

### Bug Fixes

* log devtools events ([e39575b](https://github.com/ulixee/platform/commit/e39575bb85a75469e7934c78720dcc951995595d))

### Features

* **agent:** ability to turn on wal logging ([e080534](https://github.com/ulixee/platform/commit/e0805342b1e7eac491f2bcd102b5bc91500e6b2b))
* **client:** allow injectable scriptinstance ([09aa700](https://github.com/ulixee/platform/commit/09aa700c04dc008b34822b9af446339f46f70c20))
* **client:** global instanceof checks ([b704669](https://github.com/ulixee/platform/commit/b70466975c83a947803c28c98bbdf642c7b0b052))
* **core:** out of process iframe support ([a95cfd5](https://github.com/ulixee/platform/commit/a95cfd5422115a5559c37fe00015f10760f333df))

# [2.0.0-alpha.19](https://github.com/ulixee/platform/compare/v2.0.0-alpha.18...v2.0.0-alpha.19) (2023-02-25)

### Bug Fixes

* **core:** cleanup memory variables leaking ([e3ae146](https://github.com/ulixee/platform/commit/e3ae146c0e38aa125bd9df6b1f9be564eae5aebe))
* **core:** disable defaulting sqlite wal mode on ([44b6720](https://github.com/ulixee/platform/commit/44b67203048295bd1c305419e52ca5fc1d50f6a8))
* **core:** remove wal experiment on by default ([ab33e70](https://github.com/ulixee/platform/commit/ab33e70192e0c03a51587c062ff247ecce720d2d))
* **timetravel:** simplify ticks to share state ([5b0a141](https://github.com/ulixee/platform/commit/5b0a141e2aead993345dbf3f7aa0982cdeae17f5))

### Features

* **core:** allow loading session db from path ([b8fcb28](https://github.com/ulixee/platform/commit/b8fcb28e2f529f6fb06c6eafcb5a445e8dcf22e9))
* **core:** proxy local dns feature ([bd6f7dc](https://github.com/ulixee/platform/commit/bd6f7dc4442277ae0379159ebedafc2355fa386f))
* **core:** refactor to accomodate ulixee/desktop ([be9ed0e](https://github.com/ulixee/platform/commit/be9ed0eb2ee905ea4683d814b9a5a694b94a3705))
* **hero:** add connected/session created event ([b638ef7](https://github.com/ulixee/platform/commit/b638ef7ec957f7e67ad66246bdb368214c7eff3c))
* **session:** config to delete sessions ([d06fbc8](https://github.com/ulixee/platform/commit/d06fbc8bc2f00767436faf9a9d70d3ca325c2984))

# [2.0.0-alpha.18](https://github.com/ulixee/platform/compare/v2.0.0-alpha.17...v2.0.0-alpha.18) (2023-01-17)

### Bug Fixes

* **core:** do not crash if events listener gone ([63b2206](https://github.com/ulixee/platform/commit/63b2206995b99f14c0cbb8f77b351e5b242dc4ea)), closes [#204](https://github.com/ulixee/platform/issues/204)

### Features

* use WAL mode for databases ([0830238](https://github.com/ulixee/platform/commit/08302386c35e30f336b1651eb01170418a63bd23))

# [2.0.0-alpha.17](https://github.com/ulixee/platform/compare/v2.0.0-alpha.16...v2.0.0-alpha.17) (2022-12-15)

### Features

* invert use of devtools flag ([7b39975](https://github.com/ulixee/platform/commit/7b39975c10fead577c517964f9586abb49eaee42))

# [2.0.0-alpha.16](https://github.com/ulixee/platform/compare/v2.0.0-alpha.15...v2.0.0-alpha.16) (2022-12-05)

### Bug Fixes

* **core:** subdomain cookies not being removed ([fad14db](https://github.com/ulixee/platform/commit/fad14db468a3c7354e7e5f865fa3c62bf699eac0))
* disable auto-shutdown of idle connections ([9f3356b](https://github.com/ulixee/platform/commit/9f3356bf3fa60bd527ad3f381875a365146a4bad))

### Features

* **core:** allow user to specify auto-shutdown ([18371b1](https://github.com/ulixee/platform/commit/18371b1351a00237ffe852d2fd4ca18845112b4f))

# [2.0.0-alpha.15](https://github.com/ulixee/platform/compare/v2.0.0-alpha.14...v2.0.0-alpha.15) (2022-11-17)

### Bug Fixes

* allow resource filter with leading * ([8b70497](https://github.com/ulixee/platform/commit/8b7049716281065f9d838ecef3b8182afe5ee0d4))
* devDependency version ([d94e97c](https://github.com/ulixee/platform/commit/d94e97c146cdca46f68c7d4eb52c927074c626a1))
* improve message for no browser engine ([868ce7d](https://github.com/ulixee/platform/commit/868ce7d7e51e349a6a9da2b9d32a76441d3a2f44)), closes [#185](https://github.com/ulixee/platform/issues/185)
* update awaited-dom to fix ts issue ([b98a567](https://github.com/ulixee/platform/commit/b98a5676df634947ec93e100556ecc4af6cd7890)), closes [#181](https://github.com/ulixee/platform/issues/181)

### Features

* **blockedResourceUrls:** expose and document ([2db8b93](https://github.com/ulixee/platform/commit/2db8b936ee00467bad41e1ea4408006e099c5f87))

# [2.0.0-alpha.14](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.13...v2.0.0-alpha.14) (2022-11-02)

### Features

* convert unblocked to ulixee org ([6616ec9](https://github.com/ulixee/ulixee/commit/6616ec94186da360e70544c827294b95ecb9381f))

# [2.0.0-alpha.13](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.12...v2.0.0-alpha.13) (2022-10-31)

### Bug Fixes

* **client:** fix HeroReplay replaying a sessionid ([56da409](https://github.com/ulixee/ulixee/commit/56da409ad42dffd7b45333cd53811d6a8163e550))

### Features

* add a session closed event ([0003646](https://github.com/ulixee/ulixee/commit/0003646ad65e0a182da5e1bceb17f019e469ee55)), closes [#166](https://github.com/ulixee/ulixee/issues/166)
* added hero.collect and element. from databox-for-hero ([6c6de12](https://github.com/ulixee/ulixee/commit/6c6de12562a9f85da05bbab0c81cc5d2769f7f05))
* renamed DetachedDOM to DetachedElement + getDataSnippet to getSnippet ([d58431a](https://github.com/ulixee/ulixee/commit/d58431a205e354c61c75698e3aefc46cd0ebd7bf))
* renamed HeroExtractor to HeroReplay as well as how $extract/$collect work and are named ([d97fb2d](https://github.com/ulixee/ulixee/commit/d97fb2dd1ce0b5329f6cf99af96dcd29422b55fb))
* replaced CollectedSnippets with hero.getData/setData ([96a731f](https://github.com/ulixee/ulixee/commit/96a731fd295204b7c61d3eb4fbb81131289dc606))

# [2.0.0-alpha.12](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.11...v2.0.0-alpha.12) (2022-10-03)

### Bug Fixes

* **core:** restore user profile without mitm ([333a80c](https://github.com/ulixee/ulixee/commit/333a80ca62a1d8212df6b83db4df4df441333f24)), closes [#147](https://github.com/ulixee/ulixee/issues/147)
* **core:** user profile not loading all frames ([d4f6ccc](https://github.com/ulixee/ulixee/commit/d4f6ccca2f2d56b430203eb341cd0647b8422f0c))
* update client hints spec for hero meta ([0455bf9](https://github.com/ulixee/ulixee/commit/0455bf943e3203a72e12cc43b240874b4e9bd1b8))

# [2.0.0-alpha.11](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.10...v2.0.0-alpha.11) (2022-08-31)

**Note:** Version bump only for package @ulixee/hero-core

# [2.0.0-alpha.10](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.9...v2.0.0-alpha.10) (2022-08-16)

### Bug Fixes

* **core:** record websocket messages ([911f7d7](https://github.com/ulixee/ulixee/commit/911f7d7dd5136daf08fea2715034cd7118802de9))

# [2.0.0-alpha.9](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.8...v2.0.0-alpha.9) (2022-07-26)

**Note:** Version bump only for package @ulixee/hero-core

# [2.0.0-alpha.8](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.7...v2.0.0-alpha.8) (2022-07-13)

### Bug Fixes

* **core:** fix profile restore ([bd86f48](https://github.com/ulixee/ulixee/commit/bd86f48889448ba42b5331b0502af2f9ad9dc94f))
* **core:** user profile failed w detached frame ([ada70f9](https://github.com/ulixee/ulixee/commit/ada70f9230d536b9e5cb785aeec3683bc7391fd6))

# [2.0.0-alpha.7](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.6...v2.0.0-alpha.7) (2022-06-28)

### Bug Fixes

* **core:** allow * as wildcard for resource filter ([0784b20](https://github.com/ulixee/ulixee/commit/0784b20881fa20c4c8f477e3e07cf761b6bcfdd3))
* **core:** fix unblocked references ([edabadd](https://github.com/ulixee/ulixee/commit/edabadd08738875234afc9735e0ad81c31bc5c95))
* **core:** handle command meta out of band ([11b46fd](https://github.com/ulixee/ulixee/commit/11b46fdcaf683d8c890d6beed2e582ff3b4f3882))
* **core:** resumed session should close original ([77042c8](https://github.com/ulixee/ulixee/commit/77042c8bb7df1dfeb7b49fc8f36fe643ca85914e))
* options passed into Session should parse strings into booleans ([3990f84](https://github.com/ulixee/ulixee/commit/3990f84faa88287eb0ba13153cbac1567528d8ca))
* **timetravel:** allow more leeway to find doctype ([d537d28](https://github.com/ulixee/ulixee/commit/d537d2811dbdfe82c21202accbfd5b611675a1fb))

### Features

* **client:** $contentDocument AwaitedDOM extender ([d4bacbf](https://github.com/ulixee/ulixee/commit/d4bacbfa56086e60f72b80a9b5284a0d4bb678c8))
* **client:** add stdout/stderr piping on relaunch ([bcf5bb5](https://github.com/ulixee/ulixee/commit/bcf5bb57feccd506bfd8a5ce71f4994728a361d6))
* **core:** shadow dom recorder ([5860b7c](https://github.com/ulixee/ulixee/commit/5860b7ccae96afb79f585e0bba76b4bb9590763b))

# [2.0.0-alpha.6](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.5...v2.0.0-alpha.6) (2022-06-10)

**Note:** Version bump only for package @ulixee/hero-core

# [2.0.0-alpha.5](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.4...v2.0.0-alpha.5) (2022-06-10)

**Note:** Version bump only for package @ulixee/hero-core

# [2.0.0-alpha.4](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.3...v2.0.0-alpha.4) (2022-06-09)

### Features

* no automatic shutdown of hero for connection ([65ed29d](https://github.com/ulixee/ulixee/commit/65ed29d4f4ffa775df00821619f77006cb87bd32))

# [2.0.0-alpha.3](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.2...v2.0.0-alpha.3) (2022-05-19)

**Note:** Version bump only for package @ulixee/hero-core

# [2.0.0-alpha.2](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2022-05-17)

### Bug Fixes

* **core:** server routing “Version” broken ([3853fd9](https://github.com/ulixee/ulixee/commit/3853fd9bd789eba5d737fcf8f86ab6e368781d74))

# [2.0.0-alpha.1](https://github.com/ulixee/ulixee/compare/v1.5.4...v2.0.0-alpha.1) (2022-05-16)

### Bug Fixes

* capitalized TODOs ([01b78f5](https://github.com/ulixee/ulixee/commit/01b78f51776fd1105e13e1dedc767912c2bfc65c))
* **client:** awaitedDom forEach ([105f535](https://github.com/ulixee/ulixee/commit/105f535cbfb8a0aa1cbfe34218eb638f89d83cfc))
* **client:** client hung on disconnect ([7d5d432](https://github.com/ulixee/ulixee/commit/7d5d432c9ff01a3b009fb01c489ae44cbc8a709a))
* **client:** convention of options for args ([2e94c4e](https://github.com/ulixee/ulixee/commit/2e94c4e03e2b4dc1c570ac23f75c78406e00e2cb))
* **client:** disconnect connection on process exit ([6124344](https://github.com/ulixee/ulixee/commit/6124344911b4a067f7fff9a71085c531f67f7b6d))
* **client:** fix domExtender interface ([e74b2b3](https://github.com/ulixee/ulixee/commit/e74b2b3c7032bdbf0c7458b23caab2ab5c844286))
* **client:** no waitFor in waitForState ([e22ccbe](https://github.com/ulixee/ulixee/commit/e22ccbe39265e13df51589716745d9ee7fbfd502))
* **client:** remove page state id from path ([c7ef61e](https://github.com/ulixee/ulixee/commit/c7ef61efb725003081ad8387e2fc8c3e8122b107))
* **client:** wait for command flush ([d87535f](https://github.com/ulixee/ulixee/commit/d87535ffc4a3fdfda9c601a581af4b7fa92dfd83))
* **core:**  update creating jspath from history ([eeed064](https://github.com/ulixee/ulixee/commit/eeed06431595a66d81fc0f436cd733ffdf71247c))
* **core:** allow customizing waitForVisible ([1982f52](https://github.com/ulixee/ulixee/commit/1982f52e16bca39b4ab4179e9970a190e4340652))
* **core:** better magic selector nulls/empty ([168fa89](https://github.com/ulixee/ulixee/commit/168fa89621657561ff74b40c8f671e3e952721f7))
* **core:** broadcast session event earlier ([3637084](https://github.com/ulixee/ulixee/commit/36370849a43ef8407e63ce687221a99957394c71))
* **core:** can wait for reload on post ([b3d5cbd](https://github.com/ulixee/ulixee/commit/b3d5cbd6304b6029fa2c48f22a99b887f3fe32ed))
* **core:** cleanup detached dom jspath tracking ([c427c21](https://github.com/ulixee/ulixee/commit/c427c210b00df84bf3b00fd43905ce494769d339))
* **core:** cleanup event memory ([8964a62](https://github.com/ulixee/ulixee/commit/8964a62c7d4a370e075b35946f4f81ecf977b0f4))
* **core:** collected resources not decoding ([1154d4a](https://github.com/ulixee/ulixee/commit/1154d4a7304e4cecc864e949a9e4828942190756))
* **core:** core abort test failing ([f605637](https://github.com/ulixee/ulixee/commit/f60563785aed3f9ee4f86f54f0eb33f2b08fb661))
* **core:** default waitForResource from last cmd ([a0b369e](https://github.com/ulixee/ulixee/commit/a0b369e40f70e542f226157571bb92bc409fd811))
* **core:** dom state event handler timing issue ([79ce797](https://github.com/ulixee/ulixee/commit/79ce7979998225e656a3234e711256d98e923fa0))
* **core:** don't autoshutdown core immediately ([a76739c](https://github.com/ulixee/ulixee/commit/a76739c670a13bcbdecc32c3b797e46d498f023e))
* **core:** don't record removal of donottrack ([d5fd604](https://github.com/ulixee/ulixee/commit/d5fd6041ce77cf61d8e6b9ffddc0ce01181ae068))
* **core:** don't trigger change w/o response ([67d7690](https://github.com/ulixee/ulixee/commit/67d7690a77aff95e8766c18ea5ebb60b79b2a876))
* **core:** don’t record recordOutput as command ([e7145d9](https://github.com/ulixee/ulixee/commit/e7145d950184466436d368818cf1c4d14c66f857))
* **core:** error in jspath re-lookups of xy ([2d5307e](https://github.com/ulixee/ulixee/commit/2d5307edaa5d4a9e6f32175eae09b8280c5516ad))
* **core:** fix event listener warnings ([df0e824](https://github.com/ulixee/ulixee/commit/df0e824fcf85b1545162947b8aee697b12e69b67))
* **core:** frame test failing ([f42c761](https://github.com/ulixee/ulixee/commit/f42c761be734979925880c26e5ba0df9458eab10))
* **core:** goback in-page hangs ([6946a82](https://github.com/ulixee/ulixee/commit/6946a82d4adde1a6474c9eddb37c6cc412410623))
* **core:** handle detached when elements not there ([ad11e65](https://github.com/ulixee/ulixee/commit/ad11e65a143980d8793a52e7f96054a43bb62ed8))
* **core:** handle showChromeAlive ([5b9c43c](https://github.com/ulixee/ulixee/commit/5b9c43cf7fbdead015199aec949b7b6ed1cf32ed))
* **core:** headed interactions viewport wrong ([717ff34](https://github.com/ulixee/ulixee/commit/717ff347b7c99f6ae2f493b481c858868e3f2312))
* **core:** improve profile restore time ([9f69eb2](https://github.com/ulixee/ulixee/commit/9f69eb20656d65b40f3f7f602a8b737d22781c15))
* **core:** improve script changed message ([c4d95b2](https://github.com/ulixee/ulixee/commit/c4d95b26f73460bddacaccdcfa9584f7da000835))
* **core:** in page nav not resolving resource ([e706bc1](https://github.com/ulixee/ulixee/commit/e706bc1d914f199eeb251f1b8777edfa9ef0f632))
* **core:** interaction command highlights ([b5e541f](https://github.com/ulixee/ulixee/commit/b5e541fb527f01ddc49f3e9c82c69034bc94d777))
* **core:** jspath for restoring nodes broken ([92e69ca](https://github.com/ulixee/ulixee/commit/92e69ca26ec112e0ca80c2301be7441edd7c88d5))
* **core:** lint issues ([5bb2a92](https://github.com/ulixee/ulixee/commit/5bb2a925e6c3b47ca1d14342c6062642b55f9f01))
* **core:** load fragments from other session ([8145a01](https://github.com/ulixee/ulixee/commit/8145a0125a826a413ae23f0112534ed49c9b4afc))
* **core:** load refreshed mirror page url ([9a8a5d7](https://github.com/ulixee/ulixee/commit/9a8a5d7b2f10b1c3100d257a3411dd32231ef137))
* **core:** loader failing for aborted ([a111a9e](https://github.com/ulixee/ulixee/commit/a111a9e63b4e973bd4bd26240b8dfc56210f85cd))
* **core:** make collected resources synchronous ([6439c6d](https://github.com/ulixee/ulixee/commit/6439c6d11e0ee2990de7e2ad48058382a3f30995))
* **core:** navigations directly to hash fixed ([e8b6e57](https://github.com/ulixee/ulixee/commit/e8b6e57d95e968d79575948557e1e75bd19d004c))
* **core:** painting stable resolve for url; tsconfigs ([26d3c54](https://github.com/ulixee/ulixee/commit/26d3c5462189efb9f6222d7432792eb64571a0ee))
* **core:** remove command growl ([2ea32fa](https://github.com/ulixee/ulixee/commit/2ea32fa744df7acef7a77640dbb2ec494258af3a))
* **core:** remove dom content loaded reqt for cmds ([a2bb459](https://github.com/ulixee/ulixee/commit/a2bb459fc7f6a4157d49dbef239ed2d4b52700fa))
* **core:** reparented nodes, split scripts ([c756865](https://github.com/ulixee/ulixee/commit/c756865ea8fb88566eb7d9de34e2d8c8b3b5b1e8))
* **core:** sinceCommandId validation ([fa61cc0](https://github.com/ulixee/ulixee/commit/fa61cc0bbea0ea4e26946adf40fc9066aaf7bed1))
* **core:** stabilization - wait for frame ready ([bb2706b](https://github.com/ulixee/ulixee/commit/bb2706bbdf8734bbf8baa019b620814e71a48e1d))
* **core:** throw invalid selectors, fix wait x/y ([9a0d113](https://github.com/ulixee/ulixee/commit/9a0d1132703051cacceba8adf7e03926a4790239))
* **core:** timeline fixes, nanoid ([59dbd0d](https://github.com/ulixee/ulixee/commit/59dbd0d1f55065fa60525796ac2f60f19e07706b))
* **core:** timeline subset not always loading urls ([5057ba5](https://github.com/ulixee/ulixee/commit/5057ba50fd6a4e9bb24da1731583d9333f8ac788))
* **core:** user profiles handle many sites ([a4f79cd](https://github.com/ulixee/ulixee/commit/a4f79cdc7f569488440dab297e5f9d69d6f9b368))
* **core:** userprofile restore timeout ([2b9cda1](https://github.com/ulixee/ulixee/commit/2b9cda16c6789de5ace9a84afee426f7bfd3d953))
* **core:** wait to shut down global pool ([dbb820a](https://github.com/ulixee/ulixee/commit/dbb820ae22e90ede1654a508268554b513fc94c7))
* fixed lint issues + moved Core code back into fullstack/index.ts ([5ba28d9](https://github.com/ulixee/ulixee/commit/5ba28d9b2109dd302cb9b0e02f63585efa671e84))
* **fullstack:** queue collect multiple elements ([95bea01](https://github.com/ulixee/ulixee/commit/95bea01bbef6f624e56c47eabd10fd1a315f5b88))
* **fullstack:** tests broken on ubuntu ([7bd9ff9](https://github.com/ulixee/ulixee/commit/7bd9ff9078d707ad5dcf4216500900f739840afd))
* **interaction:** cancel mouse clicks on mousedown ([afd1964](https://github.com/ulixee/ulixee/commit/afd19649c6d3c913b99cc0fa9a21e1c954f4ffbc))
* lint ([e33ee2a](https://github.com/ulixee/ulixee/commit/e33ee2aea3394370987ae5783c61a8cc15f6dd93))
* **mitm:** add cert logging ([d6dde28](https://github.com/ulixee/ulixee/commit/d6dde281893142726ea769c0e95c9443e2e665a2))
* **mitm:** allow extension url access ([b5cbd73](https://github.com/ulixee/ulixee/commit/b5cbd736ba20c3c534b9a4d6b20c954c3160e7c1))
* **mitm:** double-headers ([a424c61](https://github.com/ulixee/ulixee/commit/a424c611bf2a526f733531bf88c1c1ae37c046f2))
* **mitm:** handle mirror resources without content ([e1fedcc](https://github.com/ulixee/ulixee/commit/e1fedcceeb3d9dd49723aff3178e52217c190f7b))
* **plugins:** fix order of plugin paths loaded ([320dc60](https://github.com/ulixee/ulixee/commit/320dc60177d4924c7d46bb53227f4773dea890ec))
* **plugins:** handle chrome > 90 scroll animation ([7fc2cd2](https://github.com/ulixee/ulixee/commit/7fc2cd21d9ad4a3f61f9d049b3f7a927471266c1))
* **puppet:** better frame navigation loaders ([6078b95](https://github.com/ulixee/ulixee/commit/6078b9532afeb542c9a35a30677a74f34ea6cb62))
* **puppet:** chrome 89 fixes ([9ab8bc9](https://github.com/ulixee/ulixee/commit/9ab8bc9ae0510791dbbd644f419c1de05858c20b))
* **puppet:** fix hang on puppet close ([64173dd](https://github.com/ulixee/ulixee/commit/64173dda9947e2b702e859277e60a05c5ed40b97))
* **puppet:** improve dom storage flushing ([8c9ba36](https://github.com/ulixee/ulixee/commit/8c9ba36376c5b4f1e11108df6d1acca24eed3201))
* **puppet:** turn off final screenshot for cast ([0a9f124](https://github.com/ulixee/ulixee/commit/0a9f12469a6f7261ee46de69c8f6949c6c485e1c))
* **puppet:** user profile test/load test ([519304d](https://github.com/ulixee/ulixee/commit/519304d14cc54937ca9f1d96e3bee8bc112c3cd0))
* removed devtools-protocol package as a dependency of core ([de2dfdb](https://github.com/ulixee/ulixee/commit/de2dfdb58cba9061fcd4ba64f5fc85099517b05f))
* singularized ResourceType and KeyboardKey ([cfe39b3](https://github.com/ulixee/ulixee/commit/cfe39b353cab5bcdbe66eda6ee3b7cc6437e46c4))
* **timetravel:** about:blank broken, dup worlds ([8f8e6fa](https://github.com/ulixee/ulixee/commit/8f8e6fa897101c0c53b57f2d60186f8f92a086cf))
* **timetravel:** fix timetravel back ([7435a49](https://github.com/ulixee/ulixee/commit/7435a4962945a8af6c4db759e9980418a6c3f463))
* **timetravel:** inject scripts into blank page ([4fb79f9](https://github.com/ulixee/ulixee/commit/4fb79f9f8c18965e204ddf48aac89c1b65b863f3))
* **timetravel:** multi-tabs conflicting documents ([8943a6e](https://github.com/ulixee/ulixee/commit/8943a6eedc8154bc256c45011e8e9a3e3ebc6d32))
* **timetravel:** playbar not aligned to page ([9bf320c](https://github.com/ulixee/ulixee/commit/9bf320cfd631ac51a1c5e2ee1eefc087e6f7aee8))
* **timetravel:** resources not loading 2nd time ([b6616cd](https://github.com/ulixee/ulixee/commit/b6616cd8811ba87a1c5b8cefb541c821668dc45e))
* **timetravel:** split recording out of timeline ([671e0e9](https://github.com/ulixee/ulixee/commit/671e0e91089691e483f28eb9141b21a4605f840f))
* **timetravel:** timetravel creating dup contexts ([f64f201](https://github.com/ulixee/ulixee/commit/f64f201c402a231cb87815d3d8a83c5afc738ca8))
* **user-profile:** handle empty database ([be78e3a](https://github.com/ulixee/ulixee/commit/be78e3a665ce86faeb454e092ac59db2b8f5e0d5))

### Features

* added DevtoolsPanel and ServiceWorker hooks to CorePlugin ([9167987](https://github.com/ulixee/ulixee/commit/916798726849c41a5bfed7bf2c3a0415d6f4233e))
* added optional groupName property to PuppetPage ([fafda99](https://github.com/ulixee/ulixee/commit/fafda99d5048326adb9fac635f171eb6c4ac9346))
* added OutputTable, removed externalIds and random bugs ([1736ad2](https://github.com/ulixee/ulixee/commit/1736ad2037e43c55f459864d93c78c8eca7c4074))
* added plugins.onDevtoolsPanelAttached ([4c4578b](https://github.com/ulixee/ulixee/commit/4c4578b2bdc77037a843a313aa2feae5f29db28a))
* added ResourceTypes enum + IResourceType to hero export ([d8b0bb8](https://github.com/ulixee/ulixee/commit/d8b0bb81d48943dba638213ba24c38399f63c32a))
* added support needed for elem. in databox ([a44c0db](https://github.com/ulixee/ulixee/commit/a44c0db81a1a280f66f296d6c3bb81977f70b80a))
* **client/core:** add client loadStatus props ([21e6a3e](https://github.com/ulixee/ulixee/commit/21e6a3e0f23ce759515850d1e5d881cf7ac76567))
* **client:** ability to run exported page state ([6c33e02](https://github.com/ulixee/ulixee/commit/6c33e02749d44ae569ca15a76f1949561981f60c))
* **client:** add pause commands to api ([90e8303](https://github.com/ulixee/ulixee/commit/90e83039362e62a3ecf17b75a1c569b3813a4793))
* **client:** add serialized callstack ([7a87445](https://github.com/ulixee/ulixee/commit/7a87445a5ea772769cd5cf2df5528e9653bd12a8))
* **client:** add single resource search apis ([ecd732c](https://github.com/ulixee/ulixee/commit/ecd732c611eafd72f8d8a88216eedc5f090ba70b))
* **client:** flow commands ([af23474](https://github.com/ulixee/ulixee/commit/af23474e3351b6f60e0bac9392cbbaa979a0ab6d))
* **client:** focus and xpath dom extenders ([0888c8b](https://github.com/ulixee/ulixee/commit/0888c8b50b70193695b9fd4d1243fd55a8cd337f))
* **client:** publish callsite as json ([575f754](https://github.com/ulixee/ulixee/commit/575f75416589b7ec77c5afa246c0d40cc07cf73d))
* **client:** return resource in waitForLocation ([3ebf319](https://github.com/ulixee/ulixee/commit/3ebf319de1fc8e56448833a4ab5c703272b7697c))
* **client:** waitForPageState(states, options) ([dae7f24](https://github.com/ulixee/ulixee/commit/dae7f2446afd0716a6e2063088cb456f5f301029))
* **core:** ability to load a frozen tab from db ([12628d2](https://github.com/ulixee/ulixee/commit/12628d2c3721fd9c504c432e5f4579aa7665bafd))
* **core:** add do not track nodes to recorder ([023ec28](https://github.com/ulixee/ulixee/commit/023ec28f7e908a82e1f45b6db72978aa6bd5fafd))
* **core:** add hero meta fields to session db ([596b8a1](https://github.com/ulixee/ulixee/commit/596b8a11662b2df8905bf638243714173d444938))
* **core:** add javascript ready event to navigations ([f25ae18](https://github.com/ulixee/ulixee/commit/f25ae18ecc610b13d57786b107a9325644e1b40f))
* **core:** add keepalive message and cli ([44caf22](https://github.com/ulixee/ulixee/commit/44caf22e3a5200904a6fcc2e8cbf3269dcac5b15))
* **core:** add returns to waitForLoad/element ([ac7bd94](https://github.com/ulixee/ulixee/commit/ac7bd948c08e96496ad1887d8a013a760792b8ce))
* **core:** api to get all collected names ([c965286](https://github.com/ulixee/ulixee/commit/c9652869077090321751a220b7a2b8efe9f4b013))
* **core:** browserless session ([0de6846](https://github.com/ulixee/ulixee/commit/0de684696253181661903993fe53eb4e38c72e31))
* **core:** click verification modes ([bbfffde](https://github.com/ulixee/ulixee/commit/bbfffde792cfaf7e2a37ceb5acb781fbe4332155))
* **core:** click without verification ([285d3f6](https://github.com/ulixee/ulixee/commit/285d3f6745015be47a464490226ba90f746f7578))
* **core:** collect and recreate fragments ([69db46e](https://github.com/ulixee/ulixee/commit/69db46e40cb2a8980337d9714419cc4d045b1dbc))
* **core:** collect fragment html in background ([b6dffb3](https://github.com/ulixee/ulixee/commit/b6dffb3ae2c3b76d24e707210b9d9670072f9daa))
* **core:** collect resources ([db700e6](https://github.com/ulixee/ulixee/commit/db700e620f58e1036fa497cbc21cb4dfecdca3f0))
* **core:** collect snippet ([d6e21dd](https://github.com/ulixee/ulixee/commit/d6e21ddd5a9d1491e66071458818768fcb2a9b7e))
* **core:** collected res timestamp and commandid ([12c3c69](https://github.com/ulixee/ulixee/commit/12c3c6972b881ffd91133c058b5d646879772eec))
* **core:** command timeline ([ba2ec46](https://github.com/ulixee/ulixee/commit/ba2ec468128b8ac605c8856d07d6160164aedb0a))
* **core:** command timeline for replay ([46e0a2f](https://github.com/ulixee/ulixee/commit/46e0a2f39ee25d1e1a2296197f058550ed26d5c9))
* **core:** convert page state to dom state ([213b6c9](https://github.com/ulixee/ulixee/commit/213b6c966d887f2a97837ae0c58ab561c3e740f8))
* **core:** default browser context ([cbdeacf](https://github.com/ulixee/ulixee/commit/cbdeacf60515ed25e7b6646c7e160c4f2679f77d))
* **core:** dialogs should run out of order ([b3db8b4](https://github.com/ulixee/ulixee/commit/b3db8b44a522073fdb25497dc6f9e1affe82b471))
* **core:** find resources ([3213c91](https://github.com/ulixee/ulixee/commit/3213c91e5e2e0d2d9ada716cc13e2d0333c87c66))
* **core:** flow handlers ([cd1ced6](https://github.com/ulixee/ulixee/commit/cd1ced611d78abbd513c023662630f061f4af7f4))
* **core:** frozen tab overlay ([7e51ad0](https://github.com/ulixee/ulixee/commit/7e51ad0474f9e80227a59c791ac66ff5d8406006))
* **core:** hide mitm stack traces from view ([5ed488b](https://github.com/ulixee/ulixee/commit/5ed488bd4629887b3527d46c6626eee9844034d0))
* **core:** keyboard shortcuts ([19fa006](https://github.com/ulixee/ulixee/commit/19fa006f4ecc3f467a714d107fab25b7930fcc82))
* **core:** magic selectors ([f79170b](https://github.com/ulixee/ulixee/commit/f79170b47595dbda8765930e5493e04addbc29b1))
* **core:** min valid assertions for batch ([369e9d3](https://github.com/ulixee/ulixee/commit/369e9d3848218fde2f7f34cee57fcc5be72cf716))
* **core:** more accurate network timestamps ([c7a21ae](https://github.com/ulixee/ulixee/commit/c7a21ae283df4d6062813d77741d76499fc78505))
* **core:** pagestate loadFrom @ shortcut; mode ([de3621b](https://github.com/ulixee/ulixee/commit/de3621bf9266a6a9a4e45c5e5da1ed167537bcab))
* **core:** pause and resume sessions ([1623296](https://github.com/ulixee/ulixee/commit/1623296d86b1b54846c85cf61c5f9be1cbd6f3b5))
* **core:** publish new command events ([9792756](https://github.com/ulixee/ulixee/commit/979275696fcf2f2125a4fdb3395aa12cffa0d698))
* **core:** push page states, code module ([94ccc56](https://github.com/ulixee/ulixee/commit/94ccc56258a75633bf3f632f26fff3de78d61504))
* **core:** re-broadcast events during resume ([88b0ca9](https://github.com/ulixee/ulixee/commit/88b0ca94401e3fc24313f284e3446e9a22efb877))
* **core:** screenrecording capabiity ([475dbd6](https://github.com/ulixee/ulixee/commit/475dbd6480d596e9e034c85e65f154ec092ba43a))
* **core:** store dom ch navigation id and doctype ([c5120e6](https://github.com/ulixee/ulixee/commit/c5120e6582d600aa105d9bc9821aa29f4c9e1d7e))
* **core:** timestamp/commandId for snippets/elems ([5cb3c92](https://github.com/ulixee/ulixee/commit/5cb3c92fc8523e1903ae578565915b127f433f61))
* **core:** use local dir for page state ([d884e81](https://github.com/ulixee/ulixee/commit/d884e81448e7db9d6f8a1613f7cefe8c5449caed))
* **core:** waitForHidden elements ([564659d](https://github.com/ulixee/ulixee/commit/564659d691415bdcdf360afc2062f0f96d34a69e))
* **hero:** automatic server port use ([0199338](https://github.com/ulixee/ulixee/commit/0199338b9cdad68c7e5acd036597bf8d3252c90c))
* **mitm:** record documentUrl in resources ([295567b](https://github.com/ulixee/ulixee/commit/295567b8dfc1b8b43795dc1e07e2272b9921ae4b))
* onBrowserLaunchConfiguration is now async-able ([e3e51f7](https://github.com/ulixee/ulixee/commit/e3e51f77274c2b86fd3816edddf37585384aac0c))
* **plugins:** add ability to exec js on frame ([0f2cb97](https://github.com/ulixee/ulixee/commit/0f2cb97c6cc67d13331bcc7baebff838f028077e))
* **plugins:** add chrome 98 + selector defaults ([c27f380](https://github.com/ulixee/ulixee/commit/c27f3804b9ec7559d56021ce6890036ebde1e761))
* **plugins:** mask public ip in webrtc ([99dcf9e](https://github.com/ulixee/ulixee/commit/99dcf9e674058e1d958a6c93542cf5ba9816b2fc))
* **plugins:** on browser context ([3e5cead](https://github.com/ulixee/ulixee/commit/3e5ceadd63790191f966802d185983e11adcf0bf))
* **puppet:** ability to disable storage ([77c28fa](https://github.com/ulixee/ulixee/commit/77c28fa6b7e69e0cf05e2374284c916b312b02bc))
* **puppet:** add optional isolation for callbacks ([8c39d4b](https://github.com/ulixee/ulixee/commit/8c39d4b3b7d5b2a883eb7c7c0b0b09fcabec025e))
* **puppet:** capture resource browser load time ([1ae520c](https://github.com/ulixee/ulixee/commit/1ae520ce4047e987011a1a5c50e03e89a630c74e))
* removed hero.magicSelector/All and replaced with hero.querySelector/All shortcut ([f06d242](https://github.com/ulixee/ulixee/commit/f06d242dfd6727f0896ba9cbc1bbfb9a012b3d33))
* renamed resource outputs to getters: buffer, text, json ([3b493f2](https://github.com/ulixee/ulixee/commit/3b493f2c40cadddceaea042849933ef8bb088d4a))
* **replay:** add http status to replay ([f8fa235](https://github.com/ulixee/ulixee/commit/f8fa2350ad29cbdc7b3345669c6d98dbf11ee841))
* **replay:** enable backwards replay ([6018724](https://github.com/ulixee/ulixee/commit/6018724b5e8ffab098e6b6b83b1d2c789894eee6))
* some slight syntax changes and renames to state and flow handlers in client ([9dae5ce](https://github.com/ulixee/ulixee/commit/9dae5ce184989b3f311d14836a4ac584ad99672d))
* **timetravel:** ability to attach existing page ([419e6d1](https://github.com/ulixee/ulixee/commit/419e6d17eb8329f2475c4d85b8ed8c13bdfb1d8b))
* **timetravel:** allow backwards traveling ([0d667ba](https://github.com/ulixee/ulixee/commit/0d667ba753847f7a34de3f0bbb732b6683e31499))
* **timetravel:** allow tracking a focused range ([e0dad2a](https://github.com/ulixee/ulixee/commit/e0dad2aa39f6a22a90a5e620db2ff7c410bad507))
* **timetravel:** check resources for page state ([0d3f292](https://github.com/ulixee/ulixee/commit/0d3f292edbd8d60bc70c517340ba25dc6054e7c4))
* **timetravel:** cookies/storage for pagestate ([76d88b9](https://github.com/ulixee/ulixee/commit/76d88b9988316170a93d1191e491ff67b91d874d))
* **timetravel:** publish paint tick events ([8f3022f](https://github.com/ulixee/ulixee/commit/8f3022fbb8bb0764d48c8c3897a09281bf63592d))
* **timetravel:** version 1 of PageStateGenerator ([cf590ab](https://github.com/ulixee/ulixee/commit/cf590aba510b4c5035e68b0cfa9972d9d1e2fcad))
* unify plugin structure ([6b9138d](https://github.com/ulixee/ulixee/commit/6b9138d890b6fb845af057fef4f390522614978f))
