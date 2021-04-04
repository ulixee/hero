// tslint:disable-next-line
import { UnixTimestamp } from './GenericTypes';

type NodeId = number;
type RelatedNodeId = NodeId;
type FocusEventType = 'in' | 'out';

export type IFocusEvent = [FocusEventType, NodeId, RelatedNodeId, UnixTimestamp];
