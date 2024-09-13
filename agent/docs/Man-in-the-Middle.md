# Man-in-the-Middle

Unblocked Agent proxies all Browser traffic through a Man-in-the-Middle by default. This is to ensure UserAgents, headers and TLS settings all perfectly emulate a real Chrome browser on a home Operating System.

# Mitm-Socket

Man-in-the-Middle uses a Socket library built in Golang to:

1. Provision certificates for the Mitm
2. Create TLS connections mimicking specific versions of Chrome (using the [uTLS](https://github.com/ulixee/utls) library)
