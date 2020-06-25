type ResourceType =
  | 'Document'
  | 'Redirect'
  | 'Websocket'
  | 'Ico'
  | 'Preflight'
  | 'Script'
  | 'Stylesheet'
  | 'Xhr'
  | 'Fetch'
  | 'Image'
  | 'Media'
  | 'Font'
  | 'Text Track'
  | 'Event Source'
  | 'Manifest'
  | 'Signed Exchange'
  | 'Ping'
  | 'CSP Violation Report'
  | 'Other';

const chromeResourceTypes: { [chromeType: string]: ResourceType } = {
  Document: 'Document',
  Redirect: 'Redirect',
  Ico: 'Ico',
  Preflight: 'Preflight',
  Script: 'Script',
  Stylesheet: 'Stylesheet',
  Xhr: 'Xhr',
  Fetch: 'Fetch',
  Image: 'Image',
  Media: 'Media',
  Font: 'Font',
  TextTrack: 'Text Track',
  EventSource: 'Event Source',
  Manifest: 'Manifest',
  SignedExchange: 'Signed Exchange',
  Ping: 'Ping',
  CSPViolationReport: 'CSP Violation Report',
  Other: 'Other',
};

export function getResourceTypeForChromeValue(resourceType: string): ResourceType {
  return chromeResourceTypes[resourceType];
}

export default ResourceType;
