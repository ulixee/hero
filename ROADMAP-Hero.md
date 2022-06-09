## 2.0 - Hello World
Hero 2.0 pulls over the best features of SecretAgent, including the ability to avoid most bot blockers and its W3C spec “awaited” DOM. It also introduced several completely new features, such as recording your script's sequential commands with full “playback support”, waiting for “Page States” and creating Flow Handlers that can react to and address various page states.

Remaining items before Stable Release:

- Fix Chrome 95+ TLS Signature (ALPS extension). The signature is currently invalid.
- Update to latest version of Chrome

## 2.11 - Improve Reactivity
Hero 2.11 further refines the concept of FlowHandlers and State. We want to enhance FlowHandlers with fine grained control, as well as introducing Element State.
- Add ability to unsubscribe from FlowHandlers
- Introduce the concept of “State” on specific Elements, eg, querySelector(‘.link’).waitForState(...)


# UNVERSIONED

## Better Query Selectors
When writing Query Selectors in Hero, there is often a need to find one of many elements that is Visible or “In Viewport”. In a reactive website, the same “element” criteria might be swapped in and out of the page many times. We would like to improve interactions with these types of elements.
- Super Selectors (ability to do things like “:isVisible” or :isHidden)
- Live Query Selectors by Default

## More Robust Networking Layer
Some efforts of data extraction do not require a full browser environment. We’d like to improve this use case. In addition, as Chrome continues to evolve the web and http spec, it has been difficult to keep up using NodeJS as a network layer. For instance, http3 runs over UDP and Chrome continues to have limited proxying. We aim to consider other long term options.
- Convert Man-in-the-Middle from NodeJs to Chrome’s network stack
- Support for Quic
- First class support for http calls
- Better TCP control
- Future proof https changes

## Performance Improvements OPEN
Only a small effort has been put into maximizing Heros’ throughput. We would like to experiment with items to improve individual session performance as well as parallelization.
- Pooling browser contexts (pre-warming some number)
- An ability to turn off DB storage of some items (like devtools API calls)
- Profile of full session

## Improve Human emulations OPEN
Human emulation has room for improvement in the mouse movement directions, configurability and most importantly, “between” commands.
- More realistic mouse movements
- Spelling and mouse mistakes
- Some form of mouse movement between commands or during waitFor*
- Real human recording and transforming into mouse movements.

## Improve browser emulation OPEN
Browser emulation has come a long way, but still only covers a small fraction of possible DOM APIs that can be probed. In addition, it can be very difficult to detect which part of the spec is being probed and detected. We ultimately need to improve this story to be able to support the community.
- WebGL anti-fingerprinting
- Canvas anti-fingerprinting
- Audio anti-fingerprinting
- OS-level Font/Emoji emulation (or anti-fingerprinting)
- Automated Updating of Default Browser Emulator when new Chrome versions are released.
- Frame Environment polyfill (analyze and polyfill)
- Worker Environment polyfills (analyze and polyfill)
