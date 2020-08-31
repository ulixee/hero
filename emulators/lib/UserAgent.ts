import { UAParser } from 'ua-parser-js';

export default class UserAgent {
  public version: { major: string; minor: string; patch?: string };
  public os: { family: string; major: string; minor: string };

  public get family() {
    return this.parsedAgent.getBrowser().name;
  }

  private readonly parsedAgent: UAParser;

  constructor(uastring: string) {
    this.parsedAgent = new UAParser(uastring);
    const os = this.parsedAgent.getOS();
    const [osMajor, osMinor] = os.version?.replace(/[^\d.]/g, '').split('.') ?? ['0', '0'];
    this.os = {
      family: os.name,
      major: osMajor,
      minor: osMinor,
    };

    const [major, minor, patch] = this.parsedAgent
      .getBrowser()
      .version?.replace(/[^\d.]/g, '')
      .split('.') ?? ['0', '0', '0'];
    this.version = {
      major,
      minor,
      patch,
    };
  }
}
