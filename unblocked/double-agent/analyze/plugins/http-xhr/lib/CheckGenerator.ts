import IProfile from '@double-agent/collect-http-basic-headers/interfaces/IProfile';
import SharedCheckGenerator from '@double-agent/analyze/lib/headers/SharedCheckGenerator';
import NumberCheck from '@double-agent/analyze/lib/checks/NumberCheck';
import BaseCheck from '@double-agent/analyze/lib/checks/BaseCheck';

export default class CheckGenerator {
  public readonly checks = [];

  private readonly profile: IProfile;
  private readonly userAgentId: string;

  constructor(profile: IProfile) {
    this.profile = profile;

    const { userAgentId, data } = profile;
    this.userAgentId = userAgentId;

    this.checks.push(...this.getPreflightCountChecks());

    const checks = new SharedCheckGenerator(userAgentId, data);

    this.checks.push(
      ...checks.createHeaderCaseChecks('x-lower-sessionid', 'x-header-sessionid'),
      // XHR have all kinds of order changes. For now, we're just going to remove anything that moves
      ...checks.createHeaderOrderChecks(
        'sec-ch-ua',
        'sec-ua-mobile',
        'sec-fetch-mode',
        'sec-fetch-dest',
        'user-agent',
        'accept',
        'content-type',
        'content-length',
      ), // content-type location varies in the headers
      ...checks.createDefaultValueChecks(),
    );
  }

  private getPreflightCountChecks(): BaseCheck[] {
    const { data } = this.profile;

    const preflightsByOrigin: {
      [origin: string]: {
        GET: {
          [protocol: string]: number;
        };
        POST: {
          [protocol: string]: number;
        };
      };
    } = {} as any;

    const origins = new Set<string>();
    for (const page of data) {
      origins.add(page.originType);
    }
    for (const origin of origins) {
      preflightsByOrigin[origin] = {
        GET: {
          http: 0,
          https: 0,
          http2: 0,
        },
        POST: {
          http: 0,
          https: 0,
          http2: 0,
        },
      };
    }

    for (const page of data) {
      const { protocol, method: httpMethod, originType } = page;
      if (httpMethod === 'OPTIONS') {
        const sourceRequest = data.find(
          x => x.pathname === page.pathname && x.protocol === protocol && x.method !== httpMethod,
        );
        if (sourceRequest) preflightsByOrigin[originType][sourceRequest.method][protocol] += 1;
      }
    }

    const checks: BaseCheck[] = [];

    for (const [originType, methods] of Object.entries(preflightsByOrigin)) {
      for (const [httpMethod, protocols] of Object.entries(methods)) {
        for (const [protocol, preflights] of Object.entries(protocols)) {
          const path = `${originType}:preflightRequests`;
          const check = new NumberCheck(
            { userAgentId: this.userAgentId },
            { httpMethod, protocol, path },
            preflights,
          );
          checks.push(check);
        }
      }
    }
    return checks;
  }
}
