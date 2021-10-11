export default class PageStateAssertions {
  private assertsBySessionId: { [sessionId: string]: IFrameAssertions } = {};

  public iterateSessionAssertionsByFrameId(
    sessionId: string,
  ): [frameId: string, assertion: IAssertionAndResultByQuery][] {
    return Object.entries(this.assertsBySessionId[sessionId]);
  }

  public getSessionAssertionWithQuery(
    sessionId: string,
    frameId: number,
    query: string,
  ): IAssertionAndResult {
    if (!this.assertsBySessionId[sessionId]) return;
    const frameAssertions = this.assertsBySessionId[sessionId][frameId];
    if (frameAssertions) return frameAssertions[query];
  }

  public recordAssertion(sessionId: string, frameId: number, assertion: IAssertionAndResult) {
    this.assertsBySessionId[sessionId] ??= {};
    this.assertsBySessionId[sessionId][frameId] ??= {};
    this.assertsBySessionId[sessionId][frameId][assertion.query] = assertion;
  }

  public getCommonSessionAssertions(
    sessionIds: Set<string>,
    startingAssertions: IFrameAssertions,
  ): IFrameAssertions {
    let state = startingAssertions;
    for (const sessionId of sessionIds) {
      // need a starting place
      if (!state) {
        state = this.assertsBySessionId[sessionId];
        continue;
      }
      // now compare other sessions to "starting state"
      // TODO: match frames better than just "id" (check frame loaded url/name/id/dom path)
      for (const [frameId, assertions] of this.iterateSessionAssertionsByFrameId(sessionId)) {
        for (const [key, value] of Object.entries(assertions)) {
          if (!state[frameId]) continue;
          const existing = state[frameId][key];
          if (!existing) continue;

          if (existing.result === value.result) {
            continue;
          }
          if (typeof existing.result === 'number' && typeof value.result === 'number') {
            existing.result = Math.min(existing.result, value.result);
            existing.comparison = '>=';
            continue;
          }
          delete state[frameId][key];
        }
      }
    }
    return state;
  }

  public static removeAssertsSharedBetweenStates(states: IFrameAssertions[]): void {
    for (const state of states) {
      for (const [frameId, asserts] of Object.entries(state)) {
        for (const path of Object.keys(asserts)) {
          for (const otherState of states) {
            if (otherState === state) continue;

            // TODO: match frames better than just "id" (check frame loaded url/name/id/dom path)
            const otherAsserts = otherState[frameId];
            if (!otherAsserts) {
              break;
            }
            // if path and result is same, delete
            if (otherAsserts[path] && asserts[path].result === otherAsserts[path].result) {
              delete otherAsserts[path];
              delete asserts[path];
            }
          }
        }
      }
    }
  }
}

export interface IFrameAssertions {
  [frameId: string]: IAssertionAndResultByQuery;
}

export interface IAssertionAndResult {
  type: 'xpath' | 'qs' | 'resource' | 'url';
  query: string;
  comparison: '===' | '>=' | '>' | '<' | '<=' | 'contains';
  result: number | string | boolean;
}

interface IAssertionAndResultByQuery {
  [query: string]: IAssertionAndResult;
}
