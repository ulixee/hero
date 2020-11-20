// tslint:disable-next-line
import { CommandId, ISOTimestamp } from './GenericTypes';

/**
 * Buttons are a bit field from the DOM
 * 0	No button pressed
 * 1	Main button pressed (usually the left button)
 * 2	Secondary button pressed (usually the right button)
 * 4	Auxiliary button pressed (usually the middle button)
 */

type PageX = number;
type PageY = number;
type OffsetX = number;
type OffsetY = number;
type NodeId = number;
type Buttons = number;
type RelatedNodeId = NodeId;
type MouseEventType = number;

export type IMouseEvent = [
  CommandId,
  MouseEventType,
  PageX,
  PageY,
  OffsetX,
  OffsetY,
  Buttons,
  NodeId,
  RelatedNodeId,
  ISOTimestamp,
];
