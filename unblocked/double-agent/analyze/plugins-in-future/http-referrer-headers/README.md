https://webkit.org/blog/9661/preventing-tracking-prevention-tracking/
Safari 13.0.4

ITP now downgrades all cross-site request referrer headers to just the page’s origin. Previously, this was only done for cross-site requests to classified domains.

As an example, a request to https://images.example that would previously contain the referrer header “https://store.example/baby/strollers/deluxe-stroller-navy-blue.html” will now be reduced to just “https://store.example/”.
