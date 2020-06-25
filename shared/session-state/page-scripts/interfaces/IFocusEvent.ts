// tslint:disable-next-line
import { CommandId, ISOTimestamp } from './GenericTypes';

type NodeId = number;
type RelatedNodeId = NodeId;
type FocusEventType = 'in' | 'out';

export type IFocusEvent = [CommandId, FocusEventType, NodeId, RelatedNodeId, ISOTimestamp];
