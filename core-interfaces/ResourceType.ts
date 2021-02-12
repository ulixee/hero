// eslint-disable-next-line import/no-extraneous-dependencies
import Protocol from 'devtools-protocol';
import Network = Protocol.Network;
import DevtoolsResourceType = Network.ResourceType;

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

const chromeResourceConversions = new Map<DevtoolsResourceType, ResourceType>([
  ['XHR', 'Xhr'],
  ['TextTrack', 'Text Track'],
  ['EventSource', 'Event Source'],
  ['SignedExchange', 'Signed Exchange'],
  ['CSPViolationReport', 'CSP Violation Report'],
]);

export function getResourceTypeForChromeValue(resourceType: DevtoolsResourceType): ResourceType {
  return chromeResourceConversions.get(resourceType) ?? (resourceType as ResourceType);
}

export default ResourceType;
