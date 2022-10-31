# Unblocked Plugins

Unblocked Plugins are a set of plugins following the Unblocked Agent [Specifications][spec] to mask headless Chrome "markers" that can be detected by bot-blockers. Many of these evasions use auto-generated data from real Browser profiles generated with the [DoubleAgent][double-agent] project.

We would like to eventually port evasions from across the web to fit this specification.

Current evasions include:

### Human-like Interactions

Adds scroll vectors, mouse vectors and time delays to common interactions with browser elements.

### Headless Chrome vs Headed Chrome Polyfills

This emulation adds and patches properties and methods that are not implemented in some operating systems (like Bluetooth on Linux, IFrame content windows, etc).

### Javascript Proxy Markers

When emulating all of these evasions, the use of Javascript Proxies is often the technique used to change or mask behavior. Among the detections are the original `toString` of functions, Prototype inheritance, `instanceof` checks, error stacks and more. This utility library allows plugins to use a detection free Javascript Proxy.

### User Notifications

Sets notification preference defaults to match headed Chrome defaults.

### Viewport, Screen Resolution and Offset

This emulation uses data from real operating systems to determine appropriate screen sizes, border/chrome width, and expected offsets on the page (to account for common dock configurations).

### Media Devices

Adds a consistent auto-generated Video card on headless Chrome sessions. Headless Chrome does not attempt to provide video media devices, so can be used to capture this.

### Media Codecs

Ensures all available Codecs match the browser Codecs.

### Navigator Plugins

Ensures the navigator plugins match the given Chrome version and javascript structure.

### Geolocation

Enables setting Geolocation for a user and setting appropriate prompts

### Locale

Enables setting the user language in both HTTP headers, the DOM Navigator properties, and the WorkerNavigator properties.

### Timezone

Enables setting the user Timezone to an appropriate value. Will update Javascript environments to consistently match.

### UserAgent + UserAgentData in Frames and Workers

Ensures UserAgent and UA Hints are properly emulated and consistent across all Frames and Worker types (Web Worker, Service Worker and Shared Worker).

### IP Address

WebRTC exposes the real IP address of a host machine when a Proxy is in use. This evasion allows a user to specify a Proxy IP Address that will overwrite the actual Public IP address of a host machine.

### TCP Settings

Sets common "markers" in a TCP frame to emulate Operating Systems. Ie, WindowSize and TTP can vary (consistently) across Windows, MacOS and Linux.

### TlS ClientHello Profiles

Sets the TLS Profile to match the TLS of a headed Chrome session for the appropriate version. ClientHello attributes are consistent across all Operating Systems for a given Chrome version, which allows you to determine if a Secure (TLS) socket matches the Chrome version in the User Agent data.

### HTTP Headers

Sets HTTP/1 and HTTP/2 headers for various Resource Types to match the default order of the browser. These headers, cases and orders are consistent for some types of requests. They also sometimes vary when running headless Chrome. To ensure UserAgent is always set correctly and headers always follow the right order (even in Worker environments), we've found it is necessary to Man-in-the-middle HTTP requests and set them ot the right values.

### HTTP2 Session Settings

Sets HTTP/2 Settings to the correct initial values for a given browser.

### First Party Cookies

Chrome and Safari took steps to only allow "cookies" to be set when a user has directly interacted with a website. This means you cannot set certain cookie and storage properties if a user is redirected through a 3rd party site until that 3rd party site is visited. This is an extra plugin that can be installed to mimic such a browser.

### DNS over TLS

Chrome and other browsers will DNS over HTTPS and DNS over TLS when the host DNS server supports it. This means Ad frames will still work even if a router attempts to block direct DNS requests (it can't see the encrypted DNS requests). This setting allows your engine to mimic the default Chrome behavior.

## Areas TODO

The following areas need to be completed. There is some fantastic work in the community (like [Puppeteer Stealth][stealth] and [FakeBrowser][fake]) that have demonstrated workarounds for some of these items. We would love to port or implement similar evasions in this set of community plugins.

### Fonts + Font Fingerprinting

Fonts have many ways they can be detected - from simply adding a DOM Element with a Font and checking the CSSComputedStyle, to checking the outputted rendering size. Certain fonts raise suspicion if they are present on an OS that does not match the UserAgent OS (like Apple fonts and Windows specific fonts). In addition, the Font profile of a machine can be used as a Fingerprinting mechanism, so font rotation is important.

### Emojis + Emoji Fingerprinting

Emojis operate similar to the fonts, but are much more likely to be a "tell" that you are faking out an Operating System (assuming it's harder to install emojis that mimic "Apple" than to add a font).

### Canvas Fingerprinting

Rendering Canvas output for a series of commands is often used to fingerprint machines. Best approach is to add noise to rendered output, but small enough to not change the desired image.

### WebGL Fingerprinting

WebGL adds more details to the above - the settings of a GPU and output can both be used to fingerprint and detect deceptions.

### Audio Fingerprinting

Like the above, this fingerprinting technique uses unique markers in the hardware to fingerprint the device.

### Worker Environments

Measure and mask any differences in Web Worker, Shared Worker and Service Worker javascript environments differ across Chrome versions, operating systems. We are currently masking navigator data, but need further analysis of properties that change, particularly headed vs headless.

### IFrame Environments

Measure and mask any differences in Sandboxed IFrames, Cross Domain IFrames, Srcdoc IFrames, etc. We are currently masking known checks for `src` and `contentWindow` properties of IFrames, but need [DoubleAgent][double-agent] data to measure additional properties that could be used to detected headless Chrome or specific versions of Chrome.

### QUIC

QUIC (or HTTP/3) hasn't gained much use on the web to date, but if/as it does, we will need to proxy and mask QUIC traffic.
Much of it behaves like HTTP/2, but it runs over UDP. UDP is unfortunately difficult to proxy. Need to find a way to capture the proxy traffic and then send it through in the correct format. One potential path here is to fork the Chrome `net` stack and use that for the Proxy and/or network "service" in Chrome. This needs more exploration for viability.

### Future-proofing

Future proofing Bot-Blockers will require some creativity. We welcome any experiments, ideas and suggestions. Because this project aims to collect all the best evasions on the web, it will also be a one-stop shop for Bot Blocker authors. Staying ahead of the curve means we need to look valid across enough surface area that a Bot Blocker author starts to risk blocking real users. We believe that apex will make most bot-blockers un-viable.

Some raw ideas:

- Add a "mode" to Unblocked [Agent][agent] that proxies all DOM methods to see what is being checked (possibly by injected a custom "window/self" proxy in all scripts that are used by a webpage).
- Could we implement a way to "probe" DOM methods using code snippets from MDN or github projects? This could be used to provide inputs to test to a [DoubleAgent][double-agent] Collect plugin.

## Contributing

We'd love your help improving Unblocked plugin evasions. Please don't hesitate to send a pull request. The list of TODOs in the previous section are some great places to start.

NOTE: If pulling from other repositories, please seek the approval of those authors first!!

All `Unblocked` projects use eslint for code standards and ensure lint + test are run before allowing any pushes.

This project has a [code of conduct](../CODE_OF_CONDUCT.md). By interacting with this repository, organization, or community you agree to abide by its terms.

## License

[MIT](LICENSE.md)

[agent]: ../agent
[double-agent]: ../double-agent
[spec]: ../specification
[jspath]: ../jspath
[vault]: https://github.com/ulixee/chrome-versions
[fake]: https://github.com/kkoooqq/fakebrowser
[stealth]: https://github.com/berstend/puppeteer-extra
