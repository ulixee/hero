To test SSL signatures, I like to use Wireshark. Once you download Wireshark, you need to go into Preferences/Protocols/TLS and point at a Pre-master keylog file. I like to use ~/keylog.log (use the full path in the setting).

To measure a chrome session, you'll need to start monitoring your network interface in Wireshark.

Now set export SSLKEYLOGFILE=$HOME/keylog.log and launch Chrome to your page.
`$HOME/Library/Caches/ulixee/chrome/105.0.5195.125/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --user-data-dir=/tmp/chrome --use-mock-keychain --no-first-run "<ENTER URL HERE>"`

Save your log and now start recording again. This time, run an agent 'goto'.
