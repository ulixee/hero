# Real User Agents

Real User Agents is a library created for use in the Unblocked and Ulixee projects. It sources real user agent strings from BrowserStack browsers, Chromium source control, and Statcounter statistics so that current, popular user agent strings can be generated for automation software.

## Updating

Source data can be updated by using `npm run update`.

1. Update Browserstack UserAgent Strings
   - `$ npm run update:agents`
2. Manually update Browser and OS Information with versions pushed out (used in Scraper Report):
   - data/manual/browserReleaseDates.json
   - data/manual/osReleaseDates.json (updated by `scripts/importOsVersions.js`)
   - data/manual/browserDescriptions.json
   - data/manual/osDescriptions.json
   - data/os-mappings/macOsVersionAliasMap.json - any mappings of versions to "rollups"
   - data/os-mappings/macNameToVersionMap.json - any mappings of versions to "rollups"
   - data/os-mappings/windowsToWindowsVersionMap.json - any mappings of windows versions
3. Update Data
   - `$ npm run update`

## Installation

```shell script
npm i --save @ulixee/real-user-agents
```

## Contributing

Contributions are welcome.

## License

[MIT](LICENSE)
