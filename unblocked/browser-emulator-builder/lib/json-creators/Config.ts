import * as Fs from 'fs';
import IBrowserEngineOption from '@unblocked-web/specifications/agent/browser/IBrowserEngineOption';

interface IConfig {
  defaultLocale: string;
  features: string[];
}

export default class ConfigJson {
  public readonly browserId: string;
  public readonly browserEngineId: string;
  public readonly browserEngineOption: IBrowserEngineOption;
  private readonly data: IConfig;

  constructor(
    browserId: string,
    browserEngineId: string,
    browserEngineOption: IBrowserEngineOption,
  ) {
    this.browserId = browserId;
    this.browserEngineId = browserEngineId;
    this.browserEngineOption = browserEngineOption;
    this.data = {
      defaultLocale: 'en-US,en',
      features: [],
    };
  }

  public save(baseDir: string): void {
    if (!Fs.existsSync(baseDir)) Fs.mkdirSync(baseDir, { recursive: true });

    const dataString = JSON.stringify(this.data, null, 2);
    Fs.writeFileSync(`${baseDir}/config.json`, `${dataString}`);
  }
}
