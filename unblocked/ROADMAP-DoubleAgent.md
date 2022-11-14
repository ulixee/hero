## 2.0
[x] Open up Slab Data

- Data Catalog
Double Agent has a large cache of data representing profiles of known browsers, “probes” to identify their characteristics, and currently popular browser engine/operating system combinations. It currently lives in a giant compressed zip file. This data catalog needs to find a “git” based home.
[x] Convert to one or more data projects
[x] Submodule(s) to DoubleAgent

- Automation
We would like to automate the updating of DoubleAgent profiles and statistics.
[x] Automate Statistics Refresh
[x] Test New Profiles as Available
[x] Automatic Commits to Data Projects

# UNVERSIONED

## User Variety
We currently detect consistency across a limited number of machines for all “Collect” data. We would like to initiate a wider collection of data to determine which variables have variety or consistency across many machines.
- Manual User Testing
- Improve UI for Collect Testing

## Collect + Analysis
Double Agent has many more layers of collect and analysis to perform.
- Frame DOM Environments (Sandboxed, Cross-site, etc)
- Worker Environments (Service, Shared, Dedicated)
- WebGL
- Canvas
- Audio
- VM Detection
- User Interaction
- Javascript Evasion Detection (JS Proxies, etc)
[x] UA Hints
- UDP/Quic
