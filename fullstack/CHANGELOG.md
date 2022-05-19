# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-alpha.3](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.2...v2.0.0-alpha.3) (2022-05-19)

**Note:** Version bump only for package @ulixee/hero-fullstack





# [2.0.0-alpha.2](https://github.com/ulixee/ulixee/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2022-05-17)

**Note:** Version bump only for package @ulixee/hero-fullstack





# [2.0.0-alpha.1](https://github.com/ulixee/ulixee/compare/v1.5.4...v2.0.0-alpha.1) (2022-05-16)


### Bug Fixes

* **client:** awaitedDom forEach ([105f535](https://github.com/ulixee/ulixee/commit/105f535cbfb8a0aa1cbfe34218eb638f89d83cfc))
* **client:** no waitFor in waitForState ([e22ccbe](https://github.com/ulixee/ulixee/commit/e22ccbe39265e13df51589716745d9ee7fbfd502))
* **client:** second tab domState not working ([3daaa9d](https://github.com/ulixee/ulixee/commit/3daaa9daaaefc7f2b0872b0c5ff74f4c481a93b0))
* **client:** wait for command flush ([d87535f](https://github.com/ulixee/ulixee/commit/d87535ffc4a3fdfda9c601a581af4b7fa92dfd83))
* **core:** better magic selector nulls/empty ([168fa89](https://github.com/ulixee/ulixee/commit/168fa89621657561ff74b40c8f671e3e952721f7))
* **core:** can wait for reload on post ([b3d5cbd](https://github.com/ulixee/ulixee/commit/b3d5cbd6304b6029fa2c48f22a99b887f3fe32ed))
* **core:** cleanup detached dom jspath tracking ([c427c21](https://github.com/ulixee/ulixee/commit/c427c210b00df84bf3b00fd43905ce494769d339))
* **core:** default waitForResource from last cmd ([a0b369e](https://github.com/ulixee/ulixee/commit/a0b369e40f70e542f226157571bb92bc409fd811))
* **core:** dom state event handler timing issue ([79ce797](https://github.com/ulixee/ulixee/commit/79ce7979998225e656a3234e711256d98e923fa0))
* **core:** handle detached when elements not there ([ad11e65](https://github.com/ulixee/ulixee/commit/ad11e65a143980d8793a52e7f96054a43bb62ed8))
* **core:** in page nav not resolving resource ([e706bc1](https://github.com/ulixee/ulixee/commit/e706bc1d914f199eeb251f1b8777edfa9ef0f632))
* **core:** jspath for restoring nodes broken ([92e69ca](https://github.com/ulixee/ulixee/commit/92e69ca26ec112e0ca80c2301be7441edd7c88d5))
* **core:** make collected resources synchronous ([6439c6d](https://github.com/ulixee/ulixee/commit/6439c6d11e0ee2990de7e2ad48058382a3f30995))
* **core:** remove dom content loaded reqt for cmds ([a2bb459](https://github.com/ulixee/ulixee/commit/a2bb459fc7f6a4157d49dbef239ed2d4b52700fa))
* **core:** user profiles handle many sites ([a4f79cd](https://github.com/ulixee/ulixee/commit/a4f79cdc7f569488440dab297e5f9d69d6f9b368))
* fixed lint issues + moved Core code back into fullstack/index.ts ([5ba28d9](https://github.com/ulixee/ulixee/commit/5ba28d9b2109dd302cb9b0e02f63585efa671e84))
* **fullstack:** queue collect multiple elements ([95bea01](https://github.com/ulixee/ulixee/commit/95bea01bbef6f624e56c47eabd10fd1a315f5b88))
* **fullstack:** tests broken on ubuntu ([7bd9ff9](https://github.com/ulixee/ulixee/commit/7bd9ff9078d707ad5dcf4216500900f739840afd))
* **interaction:** cancel mouse clicks on mousedown ([afd1964](https://github.com/ulixee/ulixee/commit/afd19649c6d3c913b99cc0fa9a21e1c954f4ffbc))
* moved awaited-dom to a devDependency in fullstack ([ecdb274](https://github.com/ulixee/ulixee/commit/ecdb274b81c298f69d50c36a5d15c24c162b43a8))
* **plugins:** basic sec-ch-ua support for workers ([45f16d9](https://github.com/ulixee/ulixee/commit/45f16d9da2b1657c3f297cfccdde71ec5f0deeb5))
* **plugins:** handle chrome > 90 scroll animation ([7fc2cd2](https://github.com/ulixee/ulixee/commit/7fc2cd21d9ad4a3f61f9d049b3f7a927471266c1))
* **plugins:** mask proxy usage ([b5fcd94](https://github.com/ulixee/ulixee/commit/b5fcd94c8a6d13263798be9c149b9f6579b34f6d))
* **puppet:** chrome 89 fixes ([9ab8bc9](https://github.com/ulixee/ulixee/commit/9ab8bc9ae0510791dbbd644f419c1de05858c20b))
* **puppet:** turn off final screenshot for cast ([0a9f124](https://github.com/ulixee/ulixee/commit/0a9f12469a6f7261ee46de69c8f6949c6c485e1c))
* removed unused import ([5682ae4](https://github.com/ulixee/ulixee/commit/5682ae48581beef24402c8fff8001999c98d30f3))
* singularized ResourceType and KeyboardKey ([cfe39b3](https://github.com/ulixee/ulixee/commit/cfe39b353cab5bcdbe66eda6ee3b7cc6437e46c4))
* **timetravel:** unidentified frames break replay ([708e2dd](https://github.com/ulixee/ulixee/commit/708e2ddf75588a92366bfeb54cb7e2e6caa4b387))


### Features

* added OutputTable, removed externalIds and random bugs ([1736ad2](https://github.com/ulixee/ulixee/commit/1736ad2037e43c55f459864d93c78c8eca7c4074))
* added ResourceTypes enum + IResourceType to hero export ([d8b0bb8](https://github.com/ulixee/ulixee/commit/d8b0bb81d48943dba638213ba24c38399f63c32a))
* **client:** ability to run exported page state ([6c33e02](https://github.com/ulixee/ulixee/commit/6c33e02749d44ae569ca15a76f1949561981f60c))
* **client:** add serialized callstack ([7a87445](https://github.com/ulixee/ulixee/commit/7a87445a5ea772769cd5cf2df5528e9653bd12a8))
* **client:** add single resource search apis ([ecd732c](https://github.com/ulixee/ulixee/commit/ecd732c611eafd72f8d8a88216eedc5f090ba70b))
* **client:** flow commands ([af23474](https://github.com/ulixee/ulixee/commit/af23474e3351b6f60e0bac9392cbbaa979a0ab6d))
* **client:** focus and xpath dom extenders ([0888c8b](https://github.com/ulixee/ulixee/commit/0888c8b50b70193695b9fd4d1243fd55a8cd337f))
* **client:** for flow handler names ([8b1b144](https://github.com/ulixee/ulixee/commit/8b1b144adc56c712877af147ba95b06c2ff642fe))
* **client:** publish callsite as json ([575f754](https://github.com/ulixee/ulixee/commit/575f75416589b7ec77c5afa246c0d40cc07cf73d))
* **client:** return resource in waitForLocation ([3ebf319](https://github.com/ulixee/ulixee/commit/3ebf319de1fc8e56448833a4ab5c703272b7697c))
* **client:** waitForPageState(states, options) ([dae7f24](https://github.com/ulixee/ulixee/commit/dae7f2446afd0716a6e2063088cb456f5f301029))
* **core:** add returns to waitForLoad/element ([ac7bd94](https://github.com/ulixee/ulixee/commit/ac7bd948c08e96496ad1887d8a013a760792b8ce))
* **core:** collect and recreate fragments ([69db46e](https://github.com/ulixee/ulixee/commit/69db46e40cb2a8980337d9714419cc4d045b1dbc))
* **core:** collect fragment html in background ([b6dffb3](https://github.com/ulixee/ulixee/commit/b6dffb3ae2c3b76d24e707210b9d9670072f9daa))
* **core:** collect resources ([db700e6](https://github.com/ulixee/ulixee/commit/db700e620f58e1036fa497cbc21cb4dfecdca3f0))
* **core:** collect snippet ([d6e21dd](https://github.com/ulixee/ulixee/commit/d6e21ddd5a9d1491e66071458818768fcb2a9b7e))
* **core:** collected res timestamp and commandid ([12c3c69](https://github.com/ulixee/ulixee/commit/12c3c6972b881ffd91133c058b5d646879772eec))
* **core:** command timeline ([ba2ec46](https://github.com/ulixee/ulixee/commit/ba2ec468128b8ac605c8856d07d6160164aedb0a))
* **core:** convert page state to dom state ([213b6c9](https://github.com/ulixee/ulixee/commit/213b6c966d887f2a97837ae0c58ab561c3e740f8))
* **core:** find resources ([3213c91](https://github.com/ulixee/ulixee/commit/3213c91e5e2e0d2d9ada716cc13e2d0333c87c66))
* **core:** flow handlers ([cd1ced6](https://github.com/ulixee/ulixee/commit/cd1ced611d78abbd513c023662630f061f4af7f4))
* **core:** keyboard shortcuts ([19fa006](https://github.com/ulixee/ulixee/commit/19fa006f4ecc3f467a714d107fab25b7930fcc82))
* **core:** magic selectors ([f79170b](https://github.com/ulixee/ulixee/commit/f79170b47595dbda8765930e5493e04addbc29b1))
* **core:** re-broadcast events during resume ([88b0ca9](https://github.com/ulixee/ulixee/commit/88b0ca94401e3fc24313f284e3446e9a22efb877))
* **core:** use local dir for page state ([d884e81](https://github.com/ulixee/ulixee/commit/d884e81448e7db9d6f8a1613f7cefe8c5449caed))
* **docs:** add flow documentation ([56c2d98](https://github.com/ulixee/ulixee/commit/56c2d98f341e558217f603b64cf1ed941669a08a))
* **hero:** automatic server port use ([0199338](https://github.com/ulixee/ulixee/commit/0199338b9cdad68c7e5acd036597bf8d3252c90c))
* **plugins:** mask public ip in webrtc ([99dcf9e](https://github.com/ulixee/ulixee/commit/99dcf9e674058e1d958a6c93542cf5ba9816b2fc))
* **plugins:** remove codecs overrides for chrome ([aba86ec](https://github.com/ulixee/ulixee/commit/aba86ec57ae7d515a291998640492cc3760a9887))
* removed  from hero and added to databox ([370baad](https://github.com/ulixee/ulixee/commit/370baad788dcece8a595e705c49075be5a768287))
* removed hero.magicSelector/All and replaced with hero.querySelector/All shortcut ([f06d242](https://github.com/ulixee/ulixee/commit/f06d242dfd6727f0896ba9cbc1bbfb9a012b3d33))
* renamed resource outputs to getters: buffer, text, json ([3b493f2](https://github.com/ulixee/ulixee/commit/3b493f2c40cadddceaea042849933ef8bb088d4a))
* some slight syntax changes and renames to state and flow handlers in client ([9dae5ce](https://github.com/ulixee/ulixee/commit/9dae5ce184989b3f311d14836a4ac584ad99672d))
* **timetravel:** cookies/storage for pagestate ([76d88b9](https://github.com/ulixee/ulixee/commit/76d88b9988316170a93d1191e491ff67b91d874d))
* unify plugin structure ([6b9138d](https://github.com/ulixee/ulixee/commit/6b9138d890b6fb845af057fef4f390522614978f))
