import { Agent, lookup } from 'useragent';
import IUserAgent from '../interfaces/IUserAgent';

const records = require('../data/user-agents.json');

interface IFilterOptions {
  deviceCategory: string;
  vendor?: string;
  family: string;
  versionMajor: number;
  versionMinor?: number;
}

export default class UserAgents {
  public static getList(filter: IFilterOptions): IUserAgent[] {
    const userAgents: { [key: string]: IUserAgent } = {};
    for (const record of records) {
      const agent = lookup(record.userAgent);
      const userAgent = this.convertAgent(agent, record);
      if (this.matchesFilter(filter, userAgent)) {
        userAgents[userAgent.raw] = userAgent;
      }
    }
    return Object.values(userAgents);
  }

  public static findOne(filter: IFilterOptions): IUserAgent {
    for (const record of records) {
      const agent = lookup(record.userAgent);
      if (this.matchesFilter(filter, agent)) {
        return UserAgents.convertAgent(agent, record);
      }
    }
    return null;
  }

  public static convertAgent(
    agent: Agent,
    record: {
      platform: string;
      vendor: string;
      userAgent: string;
      deviceCategory: string;
      weight?: number;
    },
  ) {
    const os = agent.os;
    return {
      platform: record.platform,
      family: agent.family,
      vendor: record.vendor,
      os: {
        family: os.family,
        major: os.major,
        minor: os.minor,
      },
      raw: record.userAgent,
      deviceCategory: record.deviceCategory,
      version: {
        major: Number(agent.major),
        minor: Number(agent.minor),
        patch: Number(agent.patch),
      },
      weight: record.weight,
    };
  }

  private static matchesFilter(filter: IFilterOptions, userAgent: IUserAgent) {
    if (filter.deviceCategory !== userAgent.deviceCategory) {
      return false;
    }
    if (filter.family !== userAgent.family) {
      return false;
    }
    if (filter.vendor && filter.vendor !== userAgent.vendor) {
      return false;
    }
    if (filter.versionMinor !== undefined) {
      return filter.versionMinor === userAgent.version.minor;
    }
    return filter.versionMajor === userAgent.version.major;
  }
}
