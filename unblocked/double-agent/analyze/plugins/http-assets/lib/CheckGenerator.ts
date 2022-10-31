import IHttpBasicHeadersProfile from '@double-agent/collect-http-assets/interfaces/IProfile';
import SharedCheckGenerator from '@double-agent/analyze/lib/headers/SharedCheckGenerator';

export default class CheckGenerator {
  public readonly checks = [];

  private readonly profile: IHttpBasicHeadersProfile;
  private readonly userAgentId: string;

  constructor(profile: IHttpBasicHeadersProfile) {
    this.profile = profile;

    const { userAgentId, data } = profile;
    this.userAgentId = userAgentId;

    const checks = new SharedCheckGenerator(userAgentId, data);

    this.checks.push(
      ...checks.createHeaderCaseChecks(),
      ...checks.createHeaderOrderChecks(),
      ...checks.createDefaultValueChecks(),
    );
  }
}
