TODO: randomize extensions:
https://www.browserstack.com/automate/add-plugins-extensions-remote-browsers

To generate a set of plugins based on a base DOM profile:

1. Go to ./dumper and run `./run.sh Chrome80` (or add a new Dockerfile as desired)
2. $ ./dumper: `yarn start` - this will generate a profile in ./dumps
3. $ `PLUGIN_DIR=<relative path to your output directory> BASE_POLYFILL=linux_0_0__headlesschrome_80.json yarn export`
